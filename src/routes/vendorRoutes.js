const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateVendor } = require('../middleware/validationMiddleware');

router.use(authenticateToken);

router.get('/', vendorController.getAllVendors);
router.get('/:id', vendorController.getVendorById);
router.post('/', authorizeRoles('ADMIN'), validateVendor, vendorController.createVendor);
router.put('/:id', authorizeRoles('ADMIN'), validateVendor, vendorController.updateVendor);
router.delete('/:id', authorizeRoles('ADMIN'), vendorController.deleteVendor);

module.exports = router;
