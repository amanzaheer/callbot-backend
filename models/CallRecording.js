/**
 * CallRecording Model
 * Stores call recording metadata
 */

const mongoose = require('mongoose');

const callRecordingSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  
  callSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallSession',
    required: true,
    unique: true,
    index: true
  },
  
  // Twilio Recording Info
  twilioRecordingSid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  twilioAccountSid: String,
  
  // Recording Details
  url: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  fileSize: Number, // in bytes
  format: {
    type: String,
    default: 'mp3'
  },
  
  // Status
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  
  // Storage
  storagePath: String, // If downloaded locally
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
callRecordingSchema.index({ businessId: 1, createdAt: -1 });
callRecordingSchema.index({ callSessionId: 1 });

module.exports = mongoose.model('CallRecording', callRecordingSchema);

