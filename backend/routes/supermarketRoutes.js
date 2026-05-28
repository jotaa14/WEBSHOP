const express = require('express');
const router = express.Router();
const supermarketController = require('../controllers/supermarketController');

router.get('/supermarket', supermarketController.showHomePage);

router.get('/supermarket/create', supermarketController.showCreateForm);
router.post('/supermarket/create', supermarketController.createSupermarket);

router.get('/supermarket/edit', supermarketController.showEditForm);
router.post('/supermarket/edit', supermarketController.updateSupermarket);

router.get('/supermarket/orders/manage/pending', supermarketController.listPendingOrders);
router.get('/supermarket/orders/manage/confirmed', supermarketController.listConfirmedOrders);
router.get('/supermarket/orders/manage/delivering', supermarketController.listDeliveringOrders);
router.get('/supermarket/orders/manage/cancel', supermarketController.manageCancelledOrders);
router.get('/supermarket/orders/history', supermarketController.listOrderHistory);

router.post('/supermarket/orders/:id/accept', supermarketController.acceptOrder);
router.post('/supermarket/orders/:id/preparing', supermarketController.markAsPreparing);
router.post('/supermarket/orders/:id/hand-to-courier', supermarketController.handToCourier);
router.post('/supermarket/orders/:id/cancel', supermarketController.cancelOrder);
router.post('/supermarket/orders/:id/ready-for-pickup', supermarketController.markAsReadyForPickup);
router.post('/supermarket/orders/:id/mark-delivered-pickup', supermarketController.markAsDeliveredPickup);

router.get('/supermarket/returns', supermarketController.listReturns);
router.post('/supermarket/returns/:id/process', supermarketController.processReturn);
router.post('/supermarket/returns/create', supermarketController.createDirectReturn);
router.get('/supermarket/reviews', supermarketController.listMyReviews);

module.exports = router;