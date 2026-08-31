const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), auditController.getAuditLogs);

module.exports = router;
