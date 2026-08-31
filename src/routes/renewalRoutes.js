const express = require('express');
const router = express.Router();
const renewalController = require('../controllers/renewalController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', renewalController.getAllRenewals);
router.get('/:id', renewalController.getRenewalById);
router.post('/', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), renewalController.createRenewal);
router.put('/:id', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), renewalController.updateRenewal);
router.post('/:id/execute', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), renewalController.executeRenewal);

module.exports = router;
