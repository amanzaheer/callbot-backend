/**
 * Test Call Controller
 * For testing calls without real phone numbers
 * Perfect for development!
 */

const testCallService = require('../services/voice/testCallService');
const callSessionService = require('../services/call/callSessionService');
const Business = require('../models/Business');
const logger = require('../utils/logger');

class TestCallController {
    /**
     * Start a test call (simulated)
     */
    async startTestCall(req, res) {
        try {
            const { businessId } = req;
            const { to, serviceId } = req.body;

            // Validate phone number format
            if (!to || !to.startsWith('+')) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number must be in E.164 format (e.g., +923219296932)'
                });
            }

            const call = await testCallService.makeCall(businessId, to, serviceId);

            res.json({
                success: true,
                message: 'Test call started (simulated)',
                callSid: call.sid,
                callSessionId: call.callSessionId,
                status: call.status,
                note: 'This is a simulated call. Use /api/test-calls/input to send messages.'
            });
        } catch (error) {
            logger.error('Start test call error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to start test call',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Send input to test call (simulate user speaking)
     */
    async sendTestInput(req, res) {
        try {
            const { callSessionId } = req.params;
            const { text } = req.body;

            if (!text) {
                return res.status(400).json({
                    success: false,
                    message: 'Text input is required'
                });
            }

            const response = await testCallService.processTestInput(callSessionId, text);

            // Get updated call session
            const callSession = await callSessionService.getCallSession(callSessionId);

            res.json({
                success: true,
                response: response.text,
                callState: response.callState,
                nextState: response.nextState,
                collectedData: callSession.collectedData,
                missingFields: callSession.missingFields || [],
                detectedIntent: callSession.detectedIntent
            });
        } catch (error) {
            logger.error('Send test input error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process input',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Get test call status
     */
    async getTestCallStatus(req, res) {
        try {
            const { callSessionId } = req.params;

            const callSession = await callSessionService.getCallSession(callSessionId);
            if (!callSession) {
                return res.status(404).json({
                    success: false,
                    message: 'Call session not found'
                });
            }

            const conversationHistory = await callSessionService.getConversationHistory(callSessionId);

            res.json({
                success: true,
                call: {
                    id: callSession._id,
                    status: callSession.status,
                    callState: callSession.callState,
                    from: callSession.from,
                    to: callSession.to,
                    detectedIntent: callSession.detectedIntent,
                    collectedData: callSession.collectedData,
                    missingFields: callSession.missingFields || [],
                    duration: callSession.duration,
                    startTime: callSession.startTime,
                    endTime: callSession.endTime
                },
                conversation: conversationHistory
            });
        } catch (error) {
            logger.error('Get test call status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get call status'
            });
        }
    }

    /**
     * End test call
     */
    async endTestCall(req, res) {
        try {
            const { callSessionId } = req.params;

            await testCallService.endCall(callSessionId);

            res.json({
                success: true,
                message: 'Test call ended'
            });
        } catch (error) {
            logger.error('End test call error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to end call'
            });
        }
    }
}

module.exports = new TestCallController();

