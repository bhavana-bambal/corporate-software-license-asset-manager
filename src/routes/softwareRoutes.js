const express = require('express');
const router = express.Router();
const softwareController = require('../controllers/softwareController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateSoftware } = require('../middleware/validationMiddleware');

router.use(authenticateToken);

router.get('/', softwareController.getAllSoftware);
router.get('/:id', softwareController.getSoftwareById);
router.post('/', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), validateSoftware, softwareController.createSoftware);
router.put('/:id', authorizeRoles('ADMIN', 'LICENSE_MANAGER'), validateSoftware, softwareController.updateSoftware);
router.delete('/:id', authorizeRoles('ADMIN'), softwareController.deleteSoftware);

module.exports = router;
