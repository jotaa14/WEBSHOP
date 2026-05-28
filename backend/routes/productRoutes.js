const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/products', isAuthenticated, authorizeRoles('supermarket'), productController.listProducts);
router.get('/products/create', isAuthenticated, authorizeRoles('supermarket'), productController.showCreateForm);
router.post('/products/create', isAuthenticated, authorizeRoles('supermarket'), productController.createProduct);
router.get('/products/edit/:id', isAuthenticated, authorizeRoles('supermarket'), productController.showEditForm);
router.post('/products/edit/:id', isAuthenticated, authorizeRoles('supermarket'), productController.updateProduct);
router.post('/products/delete/:id', isAuthenticated, authorizeRoles('supermarket'), productController.deleteProduct);

module.exports = router;