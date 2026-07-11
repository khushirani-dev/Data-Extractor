const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const axios = require('axios');
const Institution = require('../models/Institution');

puppeteer.use(StealthPlugin());

class ScraperService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Extract emails from text using regex
  extractEmails(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  }

  // Extract phone numbers from text
  extractPhones(text) {
    const phoneRegex = /(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
    return text.match(phoneRegex) || [];
  }

  // Extract WhatsApp numbers (usually same as phone, but check for WhatsApp specific)
  extractWhatsApp(text) {
    // Look for WhatsApp specific mentions
    const whatsappRegex = /WhatsApp:?\s*(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/gi;
    const matches = text.match(whatsappRegex);
    if (matches) {
      return matches.map(m => m.replace(/WhatsApp:?\s*/i, '').trim());
    }
    return [];
  }

  // Main scraping method for educational institutions
  async scrapeInstitutions(location, type = 'all') {
    const results = [];
    const page = await (await this.initBrowser()).newPage();

    try {
      // Search queries based on type
      const searchQueries = {
        coaching: `best coaching centers in ${location}`,
        school: `schools in ${location}`,
        institution: `educational institutions in ${location}`,
        all: `coaching centers schools institutions in ${location}`
      };

      const query = searchQueries[type] || searchQueries.all;
      console.log(`Scraping for: ${query}`);

      // Google Search (using Google Maps as primary source)
      await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle2'
      });

      await page.waitForSelector('.Nv2PK', { timeout: 10000 }).catch(() => {});

      // Extract data from Google Maps
      const places = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.Nv2PK').forEach((el) => {
          const name = el.querySelector('.qBF1Pd')?.textContent || '';
          const address = el.querySelector('.W4Efsd')?.textContent || '';
          const rating = el.querySelector('.MW4etd')?.textContent || '';
          
          if (name) {
            items.push({
              name: name.trim(),
              address: address.trim(),
              rating: rating.trim(),
              source: 'Google Maps'
            });
          }
        });
        return items;
      });

      // For each place, try to get additional details
      for (const place of places) {
        const details = await this.getPlaceDetails(page, place.name);
        results.push({
          ...place,
          ...details,
          city: this.extractCity(location),
          state: this.extractState(location)
        });
      }

      // Also scrape from educational directories (Justdial, Sulekha, etc.)
      const directoryResults = await this.scrapeDirectorySites(location, type);
      results.push(...directoryResults);

      // Deduplicate and save to database
      const uniqueResults = this.deduplicateResults(results);
      const savedResults = await this.saveToDatabase(uniqueResults);

      return savedResults;

    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async getPlaceDetails(page, name) {
    try {
      // Search for the place specifically
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' contact email phone website')}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });

      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract contact information
      const text = $('body').text();
      
      return {
        email: this.extractEmails(text)[0] || '',
        phone: this.extractPhones(text)[0] || '',
        whatsapp: this.extractWhatsApp(text)[0] || '',
        website: this.extractWebsite(text)
      };
    } catch (error) {
      console.error('Error getting details for:', name);
      return {};
    }
  }

  async scrapeDirectorySites(location, type) {
    const results = [];
    const page = await (await this.initBrowser()).newPage();

    try {
      // Justdial scraping
      await page.goto(`https://www.justdial.com/search?q=${encodeURIComponent(location + ' ' + type)}`, {
        waitUntil: 'networkidle2'
      });

      const justdialResults = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('.resultbox').forEach((el) => {
          const name = el.querySelector('.resulttitle')?.textContent || '';
          const address = el.querySelector('.address')?.textContent || '';
          const phone = el.querySelector('.phone')?.textContent || '';
          
          if (name) {
            items.push({
              name: name.trim(),
              address: address.trim(),
              phone: phone.trim(),
              source: 'Justdial'
            });
          }
        });
        return items;
      });

      results.push(...justdialResults);
    } catch (error) {
      console.error('Directory scraping error:', error);
    } finally {
      await page.close();
    }

    return results;
  }

  extractWebsite(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls) {
      return urls.find(u => !u.includes('google') && !u.includes('facebook')) || '';
    }
    return '';
  }

  extractCity(location) {
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  }

  extractState(location) {
    const parts = location.split(',');
    return parts[1]?.trim() || '';
  }

  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(item => {
      const key = item.name + item.address;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return item;
    });
  }

  async saveToDatabase(results) {
    const saved = [];
    for (const result of results) {
      try {
        const [institution, created] = await Institution.findOrCreate({
          where: {
            name: result.name,
            city: result.city
          },
          defaults: {
            name: result.name,
            type: this.determineType(result),
            email: result.email || '',
            phone: result.phone || '',
            whatsapp: result.whatsapp || '',
            address: result.address || '',
            website: result.website || '',
            city: result.city || '',
            state: result.state || '',
            source: result.source || 'Web Scraper',
            scrapedAt: new Date()
          }
        });

        if (created) {
          saved.push(institution);
        }
      } catch (error) {
        console.error('Error saving:', error);
      }
    }
    return saved;
  }

  determineType(result) {
    const name = result.name?.toLowerCase() || '';
    if (name.includes('coaching') || name.includes('tution') || name.includes('training')) {
      return 'coaching';
    } else if (name.includes('school') || name.includes('academy')) {
      return 'school';
    }
    return 'institution';
  }

  // API for getting scraped data
  async getScrapedData(filters = {}) {
    const where = {};
    if (filters.type) where.type = filters.type;
    if (filters.city) where.city = filters.city;
    if (filters.state) where.state = filters.state;

    return await Institution.findAll({
      where,
      order: [['scrapedAt', 'DESC']]
    });
  }
}

module.exports = new ScraperService();