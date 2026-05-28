const express = require('express');
const router = express.Router();
const courierController = require('../controllers/courierController');

router.get('/courier/available-orders', courierController.listAvailableOrders);
router.post('/courier/orders/:id/accept', courierController.acceptDelivery);
router.get('/courier/my-deliveries', courierController.listMyDeliveries);
router.post('/courier/orders/:id/delivered', courierController.markAsDelivered);
router.get('/courier/reviews', courierController.listCourierReviews);

module.exports = router;