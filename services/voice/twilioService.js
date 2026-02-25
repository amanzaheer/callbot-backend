/**
 * Twilio Service
 * Handles Twilio API interactions for calls
 */

const twilio = require('twilio');
const logger = require('../../utils/logger');

class TwilioService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  /**
   * Initialize client with business-specific credentials
   */
  initializeBusinessClient(accountSid, authToken) {
    return twilio(accountSid, authToken);
  }

  /**
   * Make an outgoing call
   */
  async makeCall(businessPhone, to, webhookUrl, recordingEnabled = true) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }

      const call = await this.client.calls.create({
        to: to,
        from: businessPhone,
        url: webhookUrl,
        record: recordingEnabled,
        recordingStatusCallback: `${webhookUrl}/recording-status`,
        statusCallback: `${webhookUrl}/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });

      return call;
    } catch (error) {
      logger.error('Twilio make call error:', error);
      throw new Error('Failed to make call');
    }
  }

  /**
   * Generate TwiML for call handling
   */
  generateTwiML(instructions) {
    const twiml = new twilio.twiml.VoiceResponse();

    if (instructions.say) {
      twiml.say({
        voice: instructions.voice || 'alice',
        language: instructions.language || 'en-US'
      }, instructions.say);
    }

    if (instructions.play) {
      twiml.play(instructions.play);
    }

    if (instructions.record) {
      twiml.record({
        maxLength: instructions.maxLength || 30,
        action: instructions.recordAction,
        method: 'POST',
        recordingStatusCallback: instructions.recordingCallback,
        transcribe: instructions.transcribe || false,
        transcribeCallback: instructions.transcribeCallback
      });
    }

    if (instructions.gather) {
      const gather = twiml.gather({
        input: instructions.gatherInput || 'speech',
        action: instructions.gatherAction,
        method: 'POST',
        speechTimeout: instructions.speechTimeout || 'auto',
        language: instructions.language || 'en-US',
        hints: instructions.hints || ''
      });

      if (instructions.gatherSay) {
        gather.say({
          voice: instructions.voice || 'alice',
          language: instructions.language || 'en-US'
        }, instructions.gatherSay);
      }
    }

    if (instructions.redirect) {
      twiml.redirect(instructions.redirect);
    }

    if (instructions.hangup) {
      twiml.hangup();
    }

    return twiml.toString();
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid, accountSid, authToken) {
    try {
      const client = this.initializeBusinessClient(accountSid, authToken);
      const call = await client.calls(callSid).fetch();
      return call;
    } catch (error) {
      logger.error('Twilio get call details error:', error);
      throw error;
    }
  }

  /**
   * Get recording details
   */
  async getRecordingDetails(recordingSid, accountSid, authToken) {
    try {
      const client = this.initializeBusinessClient(accountSid, authToken);
      const recording = await client.recordings(recordingSid).fetch();
      return recording;
    } catch (error) {
      logger.error('Twilio get recording error:', error);
      throw error;
    }
  }

  /**
   * Download recording
   */
  async downloadRecording(recordingUrl, accountSid, authToken) {
    try {
      const client = this.initializeBusinessClient(accountSid, authToken);
      // Twilio recordings are accessed via URL with auth
      const response = await fetch(recordingUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download recording');
      }
      
      return response;
    } catch (error) {
      logger.error('Twilio download recording error:', error);
      throw error;
    }
  }

  /**
   * Transfer call to human agent
   */
  generateTransferTwiML(agentPhone) {
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Please hold while we transfer you to an agent.');
    twiml.dial(agentPhone);
    return twiml.toString();
  }
}

module.exports = new TwilioService();

