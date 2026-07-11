const scraperService = require('../services/scraperService');
const Institution = require('../models/Institution');
const { Parser } = require('json2csv');

// Scrape institutions
exports.scrapeInstitutions = async (req, res) => {
  try {
    const { location, type } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const results = await scraperService.scrapeInstitutions(location, type);

    res.json({
      success: true,
      message: `Scraped ${results.length} institutions`,
      data: results
    });

  } catch (error) {
    console.error('Scrape Error:', error);

    res.status(500).json({
      success: false,
      message: 'Error scraping institutions',
      error: error.message
    });
  }
};

// Get all institutions
exports.getInstitutions = async (req, res) => {
  try {
    const {
      type,
      city,
      state,
      page = 1,
      limit: limitQuery = '1000'
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (city) where.city = city;
    if (state) where.state = state;

    const requestedLimit = limitQuery === 'all' ? null : parseInt(limitQuery, 10);
    const limit = requestedLimit || 1000;
    const offset = (parseInt(page, 10) - 1) * limit;

    const queryOptions = {
      where
    };

    if (requestedLimit !== null) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const { count, rows } = await Institution.findAndCountAll(queryOptions);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        pages: requestedLimit === null ? 1 : Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Fetch Error:', error);

    res.status(500).json({
      success: false,
      message: 'Error fetching institutions',
      error: error.message
    });
  }
};

// Statistics
exports.getStatistics = async (req, res) => {
  try {
    const total = await Institution.count();

    const byType = await Institution.findAll({
      attributes: [
        'type',
        [
          Institution.sequelize.fn(
            'COUNT',
            Institution.sequelize.col('id')
          ),
          'count'
        ]
      ],
      group: ['type']
    });

    const byCity = await Institution.findAll({
      attributes: [
        'city',
        [
          Institution.sequelize.fn(
            'COUNT',
            Institution.sequelize.col('id')
          ),
          'count'
        ]
      ],
      group: ['city'],
      limit: 10,
      order: [[Institution.sequelize.literal('count'), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total,
        byType,
        byCity
      }
    });

  } catch (error) {
    console.error('Statistics Error:', error);

    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Export Data (JSON / CSV)
exports.exportData = async (req, res) => {
  try {

    const { format = 'json' } = req.query;

    // Fetch plain JSON objects
    const institutions = await Institution.findAll({
      raw: true
    });

    // Return CSV
    if (format.toLowerCase() === 'csv') {

      const fields = [
        'id',
        'name',
        'type',
        'email',
        'phone',
        'whatsapp',
        'address',
        'website',
        'city',
        'state',
        'pincode',
        'createdAt',
        'updatedAt'
      ];

      const parser = new Parser({ fields });

      const csv = parser.parse(institutions);

      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=institutions-${Date.now()}.csv`
      );

      return res.status(200).send(csv);
    }

    // Return JSON
    return res.status(200).json({
      success: true,
      data: institutions
    });

  } catch (error) {

    console.error('Export Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });

  }
};