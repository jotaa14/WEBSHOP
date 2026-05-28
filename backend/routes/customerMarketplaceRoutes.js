const express = require('express');
const router = express.Router();
const customerMarketplaceController = require('../controllers/customerMarketplaceController');

router.get('/customer/products', customerMarketplaceController.listProducts);
router.get('/customer/supermarkets', customerMarketplaceController.listSupermarkets);
router.get('/customer/supermarkets/:id', customerMarketplaceController.showSupermarket);
router.get('/customer/supermarkets/:id/reviews', customerMarketplaceController.listSupermarketReviews);
router.get('/customer/cart', customerMarketplaceController.showCart);
router.post('/customer/cart/add', customerMarketplaceController.addToCart);
router.post('/customer/cart/update', customerMarketplaceController.updateCartItem);
router.post('/customer/cart/remove', customerMarketplaceController.removeCartItem);
router.post('/customer/cart/checkout', customerMarketplaceController.checkoutCart);
router.post('/customer/orders/:id/cancel', customerMarketplaceController.cancelOrder);
router.get('/customer/compare/:productName', customerMarketplaceController.compareProducts);
router.get('/customer/compare', customerMarketplaceController.compareProducts);
router.get('/customer/orders', customerMarketplaceController.listMyOrders);
router.get('/customer/orders/:id/review', customerMarketplaceController.showReviewForm);
router.post('/customer/orders/:id/review', customerMarketplaceController.submitReview);
router.post('/customer/orders/return', customerMarketplaceController.requestReturn);

module.exports = router;