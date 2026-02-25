/**
 * ConversationMessage Model
 * Stores all messages in a conversation
 */

const mongoose = require('mongoose');

const conversationMessageSchema = new mongoose.Schema({
  callSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CallSession',
    required: true,
    index: true
  },
  
  // Message Type
  type: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  
  // Content
  text: {
    type: String,
    required: true
  },
  
  // Audio (if stored)
  audioUrl: String,
  
  // AI Processing Results
  aiAnalysis: {
    intent: String,
    entities: mongoose.Schema.Types.Mixed,
    confidence: Number,
    detectedFields: mongoose.Schema.Types.Mixed
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Sequence number in conversation
  sequence: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
conversationMessageSchema.index({ callSessionId: 1, sequence: 1 });
conversationMessageSchema.index({ callSessionId: 1, timestamp: 1 });

module.exports = mongoose.model('ConversationMessage', conversationMessageSchema);

