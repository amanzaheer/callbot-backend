/**
 * Call Routes
 */

const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticate, optionalAuth } = require('../middlewares/auth');

// Twilio webhooks (no auth required - Twilio validates)
router.post('/webhook', callController.handleIncomingCall.bind(callController));
router.post('/process-speech/:callSessionId', callController.processSpeech.bind(callController));
router.post('/status', callController.handleCallStatus.bind(callController));
router.post('/recording-status', callController.handleRecordingStatus.bind(callController));

// Vonage webhooks (no auth required - Vonage validates)
router.post('/answer', callController.handleVonageAnswer.bind(callController));
router.post('/inbound', callController.handleVonageInbound.bind(callController));
router.post('/vonage-speech/:callSessionId', callController.handleVonageSpeech.bind(callController));
router.post('/event', callController.handleVonageEvent.bind(callController));

// Telnyx webhooks (no auth required - Telnyx signs webhooks)
router.post('/telnyx-webhook', callController.handleTelnyxWebhook.bind(callController));

// Outgoing calls (requires auth)
router.post('/outgoing', authenticate, callController.makeOutgoingCall.bind(callController));

module.exports = router;

