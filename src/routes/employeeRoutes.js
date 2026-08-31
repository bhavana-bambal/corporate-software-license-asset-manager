const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { validateEmployee } = require('../middleware/validationMiddleware');

router.use(authenticateToken);

router.post('/request-access', employeeController.requestSoftwareAccess);

router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorizeRoles('ADMIN'), validateEmployee, employeeController.createEmployee);
router.put('/:id', authorizeRoles('ADMIN'), validateEmployee, employeeController.updateEmployee);
router.delete('/:id', authorizeRoles('ADMIN'), employeeController.deleteEmployee);

module.exports = router;
