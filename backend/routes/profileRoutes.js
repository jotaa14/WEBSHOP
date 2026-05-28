const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/profile', profileController.showProfile);
router.post('/profile/change-password', profileController.changePassword);
router.post('/profile/update', profileController.updateProfile);

module.exports = router;