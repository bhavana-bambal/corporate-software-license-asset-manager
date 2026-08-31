const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/utilization', reportController.getUtilizationReport);
router.get('/expiration', reportController.getExpirationReport);
router.get('/cost', reportController.getCostReport);
router.get('/spending', reportController.getCostReport);
router.get('/vendors', reportController.getVendorSpendingReport);
router.get('/departments', reportController.getDepartmentSpendingReport);
router.get('/assignments', reportController.getEmployeeAssignmentsReport);

module.exports = router;
