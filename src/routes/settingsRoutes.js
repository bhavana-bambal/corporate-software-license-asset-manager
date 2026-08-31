const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', authorizeRoles('ADMIN'), settingsController.updateSettings);
router.get('/backup', authorizeRoles('ADMIN'), settingsController.exportBackup);
router.post('/reset', authorizeRoles('ADMIN'), settingsController.resetToDemoData);

module.exports = router;
