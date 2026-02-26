/**
 * CallSession Model
 * Tracks each phone call session
 */

const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },

  // Twilio Call Information
  twilioCallSid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  twilioAccountSid: String,
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },

  // Call Direction
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound',
    index: true
  },

  // Language Detection
  detectedLanguage: {
    type: String,
    default: 'en',
    index: true
  },
  supportedLanguages: [String], // Languages this business supports

  // Vonage specific
  vonageCallUuid: String,

  // Call Status
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'cancelled'],
    default: 'initiated',
    index: true
  },

  // Call Flow State
  callState: {
    type: String,
    enum: ['greeting', 'collecting-intent', 'collecting-data', 'confirming', 'completed', 'transferred', 'ended'],
    default: 'greeting'
  },

  // Detected Intent
  detectedIntent: {
    type: String,
    enum: ['order', 'booking', 'inquiry', 'lead', 'complaint', 'support', 'faq', 'other'],
    index: true
  },

  // Selected Service (if applicable)
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceDefinition'
  },

  // Collected Data (dynamic based on service)
  collectedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Missing Required Fields
  missingFields: [String],

  // Confirmation Status
  confirmationStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'not-applicable'],
    default: 'not-applicable'
  },

  // Interaction Record (if finalized)
  interactionRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InteractionRecord'
  },

  // Customer Information (if identified)
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // Call Metrics
  duration: {
    type: Number, // in seconds
    default: 0
  },
  startTime: Date,
  endTime: Date,

  // Recording
  recordingUrl: String,
  recordingSid: String,

  // Error Tracking (array of strings: "ISO-date [type] message")
  callErrors: [String],

  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
callSessionSchema.index({ businessId: 1, status: 1 });
callSessionSchema.index({ businessId: 1, createdAt: -1 });
callSessionSchema.index({ twilioCallSid: 1 });
callSessionSchema.index({ from: 1 });
callSessionSchema.index({ detectedIntent: 1 });

module.exports = mongoose.model('CallSession', callSessionSchema);

