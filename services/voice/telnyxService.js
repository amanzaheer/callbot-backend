/**
 * Telnyx Voice API (Call Control) Service
 * Handles outbound calls, answer, speak, transcription, hangup
 * Pay-as-you-go pricing; works in Pakistan
 */

const axios = require('axios');
const logger = require('../../utils/logger');

const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

class TelnyxService {
  /**
   * Create outbound call
   * POST /v2/calls
   */
  async createOutboundCall(from, to, connectionId, apiKey) {
    try {
      const { data } = await axios.post(
        `${TELNYX_API_BASE}/calls`,
        {
          to,
          from,
          connection_id: connectionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );
      return data.data; // { call_control_id, call_leg_id, ... }
    } catch (error) {
      const msg = error.response?.data?.errors?.[0]?.detail || error.message;
      logger.error('Telnyx create outbound call error:', error.response?.data || error.message);
      throw new Error(`Failed to make call: ${msg}`);
    }
  }

  /**
   * Answer an inbound call (required before other commands)
   * POST /v2/calls/{call_control_id}/actions/answer
   */
  async answerCall(callControlId, apiKey) {
    try {
      await axios.post(
        `${TELNYX_API_BASE}/calls/${encodeURIComponent(callControlId)}/actions/answer`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );
    } catch (error) {
      logger.error('Telnyx answer call error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Speak text (TTS)
   * POST /v2/calls/{call_control_id}/actions/speak
   */
  async speak(callControlId, payload, apiKey, options = {}) {
    try {
      const body = {
        payload,
        voice: options.voice || 'female',
        payload_type: 'text',
        ...(options.language && { language: options.language })
      };
      await axios.post(
        `${TELNYX_API_BASE}/calls/${encodeURIComponent(callControlId)}/actions/speak`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );
    } catch (error) {
      logger.error('Telnyx speak error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Start transcription (speech-to-text) to receive user speech
   * POST /v2/calls/{call_control_id}/actions/transcription_start
   */
  async transcriptionStart(callControlId, apiKey, options = {}) {
    try {
      await axios.post(
        `${TELNYX_API_BASE}/calls/${encodeURIComponent(callControlId)}/actions/transcription_start`,
        {
          language: options.language || 'en',
          transcription_engine: options.engine || 'Google'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      const alreadyInProgress = data?.errors?.[0]?.code === '90054';
      if (status === 422 && alreadyInProgress) {
        logger.info('Telnyx transcription already in progress, skipping');
        return;
      }
      // 503/502/504 = Telnyx transcription service temporarily unavailable; don't kill the call
      if (status === 503 || status === 502 || status === 504) {
        logger.warn('Telnyx transcription temporarily unavailable', { status, detail: data?.errors?.[0]?.detail });
        return;
      }
      logger.error('Telnyx transcription_start error:', data || error.message);
      throw error;
    }
  }

  /**
   * Hangup call`
   * POST /v2/calls/{call_control_id}/actions/hangup
   */
  async hangup(callControlId, apiKey) {
    try {
      await axios.post(
        `${TELNYX_API_BASE}/calls/${encodeURIComponent(callControlId)}/actions/hangup`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      );
    } catch (error) {
      logger.error('Telnyx hangup error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Map our voice name to Telnyx speak voice
   */
  static getTelnyxVoice(voiceName) {
    const map = { female: 'female', male: 'male', alice: 'female', woman: 'female', man: 'male' };
    return map[String(voiceName).toLowerCase()] || 'female';
  }

  /**
   * Map language code to Telnyx transcription language
   */
  static getTelnyxTranscriptionLanguage(lang) {
    const map = { en: 'en', ur: 'ur', ar: 'ar', es: 'es', fr: 'fr', de: 'de', hi: 'hi', zh: 'zh-CN' };
    return map[lang] || 'en';
  }
}

module.exports = new TelnyxService();
