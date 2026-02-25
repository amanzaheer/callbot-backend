/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/calls', adminController.getCalls.bind(adminController));
router.get('/calls/:callId', adminController.getCallDetails.bind(adminController));
router.get('/interactions', adminController.getInteractions.bind(adminController));
router.get('/customers', adminController.getCustomers.bind(adminController));
router.get('/analytics', adminController.getAnalytics.bind(adminController));
router.get('/export', adminController.exportData.bind(adminController));

module.exports = router;

