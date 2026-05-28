const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/dashboard', dashboardController.showDashboard);
router.post('/dashboard/change-password', dashboardController.changePassword);

module.exports = router;