const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/sales', isAuthenticated, authorizeRoles('supermarket'), saleController.listSales);
router.get('/sales/create', isAuthenticated, authorizeRoles('supermarket'), saleController.showCreateForm);
router.post('/sales/create', isAuthenticated, authorizeRoles('supermarket'), saleController.createSale);
router.post('/sales/cancel/:id', isAuthenticated, authorizeRoles('supermarket'), saleController.cancelSale);

module.exports = router;