const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { isAuthenticated, authorizeRoles } = require('../middlewares/authMiddleware');

// User routes (Customer, Courier, Supermarket)
router.get('/support', isAuthenticated, supportController.showSupportForm);
router.post('/support/create', isAuthenticated, supportController.createTicket);
router.post('/support/:id/resolve', isAuthenticated, supportController.resolveTicket);

// Admin routes
router.get('/admin/support-tickets', isAuthenticated, authorizeRoles('admin'), supportController.listAllTickets);
router.post('/admin/support-tickets/:id/reply', isAuthenticated, authorizeRoles('admin'), supportController.replyTicket);
router.post('/admin/support-tickets/:id/cancel', isAuthenticated, authorizeRoles('admin'), supportController.cancelTicket);

module.exports = router;
