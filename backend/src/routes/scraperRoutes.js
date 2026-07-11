const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

router.post('/scrape', scraperController.scrapeInstitutions);
router.get('/institutions', scraperController.getInstitutions);
router.get('/statistics', scraperController.getStatistics);
router.get('/export', scraperController.exportData);

module.exports = router;