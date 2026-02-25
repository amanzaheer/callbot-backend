const express = require('express');
const router = express.Router();
const { telnyxWebhook } = require('../controllers/telnyxWebhook.controller');

// Absolute path is fine because this router is mounted without a base path
router.post('/api/calls/telnyx-webhook', telnyxWebhook);

module.exports = router;