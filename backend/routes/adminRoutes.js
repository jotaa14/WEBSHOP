const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/admin/validate-supermarkets', isAuthenticated, authorizeRoles('admin'), adminController.listPendingSupermarkets);
router.post('/admin/approve-supermarket/:id', isAuthenticated, authorizeRoles('admin'), adminController.approveSupermarket);
router.get('/admin/validate-couriers', isAuthenticated, authorizeRoles('admin'), adminController.listPendingCouriers);
router.post('/admin/approve-courier/:id', isAuthenticated, authorizeRoles('admin'), adminController.approveCourier);
router.get('/admin/users', isAuthenticated, authorizeRoles('admin'), adminController.listUsers);
router.delete('/admin/users/delete/:id', isAuthenticated, authorizeRoles('admin'), adminController.deleteUser);

// Avaliações / Moderação
router.get('/admin/courier-reviews', isAuthenticated, authorizeRoles('admin'), adminController.listCourierReviews);
router.delete('/admin/reviews/delete/:id', isAuthenticated, authorizeRoles('admin'), adminController.deleteReview);

// Encomendas
router.get('/admin/orders', isAuthenticated, authorizeRoles('admin'), adminController.listAllOrders);

// Categorias
router.get('/admin/categories', isAuthenticated, authorizeRoles('admin'), adminController.listCategories);
router.post('/admin/categories/add', isAuthenticated, authorizeRoles('admin'), adminController.createCategory);
router.delete('/admin/categories/delete/:id', isAuthenticated, authorizeRoles('admin'), adminController.deleteCategory);
router.get('/admin/activities', isAuthenticated, authorizeRoles('admin'), adminController.listActivities);

module.exports = router;