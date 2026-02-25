/**
 * Call Session Service
 * Manages call session lifecycle and state
 */

const CallSession = require('../../models/CallSession');
const ConversationMessage = require('../../models/ConversationMessage');
const Customer = require('../../models/Customer');
const logger = require('../../utils/logger');

class CallSessionService {
  /**
   * Create a new call session
   */
  async createCallSession(businessId, twilioCallData) {
    try {
      // Try to find existing customer
      let customer = await Customer.findOne({
        businessId,
        phone: twilioCallData.From
      });

      // Create customer if doesn't exist
      if (!customer) {
        customer = await Customer.create({
          businessId,
          phone: twilioCallData.From
        });
      }

      const callSession = await CallSession.create({
        businessId,
        twilioCallSid: twilioCallData.CallSid,
        twilioAccountSid: twilioCallData.AccountSid,
        from: twilioCallData.From,
        to: twilioCallData.To,
        status: 'initiated',
        callState: 'greeting',
        startTime: new Date(),
        customerId: customer._id
      });

      // Update customer stats
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalCalls: 1 },
        lastInteractionAt: new Date()
      });

      logger.info(`Call session created: ${callSession._id}`);
      return callSession;
    } catch (error) {
      logger.error('Create call session error:', error);
      throw error;
    }
  }

  /**
   * Update call session status
   */
  async updateCallStatus(callSessionId, status, additionalData = {}) {
    try {
      const updateData = { status, ...additionalData };
      
      if (status === 'completed' || status === 'failed') {
        updateData.endTime = new Date();
      }

      const callSession = await CallSession.findByIdAndUpdate(
        callSessionId,
        { $set: updateData },
        { new: true }
      );

      return callSession;
    } catch (error) {
      logger.error('Update call status error:', error);
      throw error;
    }
  }

  /**
   * Update call state
   */
  async updateCallState(callSessionId, newState, additionalData = {}) {
    try {
      const callSession = await CallSession.findByIdAndUpdate(
        callSessionId,
        { 
          $set: { 
            callState: newState,
            ...additionalData
          }
        },
        { new: true }
      );

      return callSession;
    } catch (error) {
      logger.error('Update call state error:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(callSessionId, type, text, aiAnalysis = null, audioUrl = null) {
    try {
      // Get current message count for sequence
      const messageCount = await ConversationMessage.countDocuments({ callSessionId });
      
      const message = await ConversationMessage.create({
        callSessionId,
        type,
        text,
        aiAnalysis,
        audioUrl,
        sequence: messageCount + 1,
        timestamp: new Date()
      });

      return message;
    } catch (error) {
      logger.error('Add message error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(callSessionId) {
    try {
      const messages = await ConversationMessage.find({ callSessionId })
        .sort({ sequence: 1 })
        .lean();

      return messages;
    } catch (error) {
      logger.error('Get conversation history error:', error);
      throw error;
    }
  }

  /**
   * Update collected data
   */
  async updateCollectedData(callSessionId, newData) {
    try {
      const callSession = await CallSession.findById(callSessionId);
      if (!callSession) {
        throw new Error('Call session not found');
      }

      const updatedData = {
        ...callSession.collectedData,
        ...newData
      };

      callSession.collectedData = updatedData;
      await callSession.save();

      return callSession;
    } catch (error) {
      logger.error('Update collected data error:', error);
      throw error;
    }
  }

  /**
   * Update missing fields
   */
  async updateMissingFields(callSessionId, missingFields) {
    try {
      const callSession = await CallSession.findByIdAndUpdate(
        callSessionId,
        { $set: { missingFields } },
        { new: true }
      );

      return callSession;
    } catch (error) {
      logger.error('Update missing fields error:', error);
      throw error;
    }
  }

  /**
   * Get call session with populated data
   */
  async getCallSession(callSessionId) {
    try {
      const callSession = await CallSession.findById(callSessionId)
        .populate('businessId')
        .populate('serviceId')
        .populate('customerId')
        .populate('interactionRecordId');

      return callSession;
    } catch (error) {
      logger.error('Get call session error:', error);
      throw error;
    }
  }

  /**
   * Record error
   */
  async recordError(callSessionId, message, type = 'error') {
    try {
      await CallSession.findByIdAndUpdate(callSessionId, {
        $push: {
          callErrors: {
            timestamp: new Date(),
            message,
            type
          }
        }
      });
    } catch (error) {
      logger.error('Record error error:', error);
    }
  }
}

module.exports = new CallSessionService();

