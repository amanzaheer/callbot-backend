/**
 * Test Call Service
 * Simulates phone calls for development/testing without real phone numbers
 * No Twilio account needed!
 */

const logger = require('../../utils/logger');
const CallSession = require('../../models/CallSession');
const callSessionService = require('../call/callSessionService');
const conversationOrchestrator = require('../conversation/conversationOrchestrator');

class TestCallService {
    /**
     * Simulate making a call
     */
    async makeCall(businessId, to, serviceId = null) {
        try {
            // Create a simulated call session
            const twilioCallData = {
                CallSid: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                AccountSid: 'TEST_ACCOUNT',
                From: to, // In test mode, "from" is the caller
                To: '+TEST_NUMBER' // Simulated business number
            };

            const callSession = await callSessionService.createCallSession(
                businessId,
                twilioCallData
            );

            // Update status to in-progress
            await callSessionService.updateCallStatus(callSession._id, 'in-progress');

            // If serviceId provided, set it
            if (serviceId) {
                await callSessionService.updateCallState(callSession._id, 'collecting-data', {
                    serviceId: serviceId
                });
            }

            logger.info(`Test call created: ${callSession._id} to ${to}`);

            return {
                sid: callSession.twilioCallSid,
                status: 'in-progress',
                callSessionId: callSession._id
            };
        } catch (error) {
            logger.error('Test call error:', error);
            throw error;
        }
    }

    /**
     * Simulate receiving speech input (for testing)
     */
    async processTestInput(callSessionId, userInput) {
        try {
            // Process through conversation orchestrator
            const response = await conversationOrchestrator.processUserInput(
                callSessionId,
                userInput
            );

            return {
                text: response.text,
                nextState: response.nextState,
                callState: response.callState
            };
        } catch (error) {
            logger.error('Process test input error:', error);
            throw error;
        }
    }

    /**
     * Generate test TwiML (simulated)
     */
    generateTestTwiML(message, gatherNext = false) {
        // In test mode, we return a simple response
        // Real implementation would use TwiML
        return {
            message: message,
            gatherNext: gatherNext,
            type: 'test'
        };
    }

    /**
     * End test call
     */
    async endCall(callSessionId) {
        try {
            await callSessionService.updateCallStatus(callSessionId, 'completed', {
                endTime: new Date()
            });

            return { success: true };
        } catch (error) {
            logger.error('End test call error:', error);
            throw error;
        }
    }
}

module.exports = new TestCallService();

