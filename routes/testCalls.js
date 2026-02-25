/**
 * Test Call Routes
 * For testing calls without real phone numbers
 */

const express = require('express');
const router = express.Router();
const testCallController = require('../controllers/testCallController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Start a test call (simulated)
router.post('/start', testCallController.startTestCall.bind(testCallController));

// Send input to test call (simulate user speaking)
router.post('/:callSessionId/input', testCallController.sendTestInput.bind(testCallController));

// Get test call status and conversation
router.get('/:callSessionId/status', testCallController.getTestCallStatus.bind(testCallController));

// End test call
router.post('/:callSessionId/end', testCallController.endTestCall.bind(testCallController));

module.exports = router;

