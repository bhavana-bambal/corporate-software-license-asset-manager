const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateLicense } = require('../middleware/validationMiddleware');

router.use(authenticateToken);

// Assignments queries
router.get('/assignments', licenseController.getAllAssignments);

// License CRUD
router.get('/', licenseController.getAllLicenses);
router.get('/:id', licenseController.getLicenseById);
router.post('/', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), validateLicense, licenseController.createLicense);
router.put('/:id', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), validateLicense, licenseController.updateLicense);
router.delete('/:id', authorizeRoles('ADMIN'), licenseController.deleteLicense);

// Seat allocation & revocation
router.post('/:id/assign', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), licenseController.assignSeat);
router.post('/:id/revoke', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), licenseController.revokeSeat);

module.exports = router;
