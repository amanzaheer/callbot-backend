/**
 * TrainingData Model
 * Stores bulk training data for bot customization
 */

const mongoose = require('mongoose');

const trainingDataSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },

  // Type of training data
  type: {
    type: String,
    enum: ['conversation', 'qa', 'example', 'context', 'instruction'],
    required: true
  },

  // For conversation examples
  conversation: {
    user: String,
    assistant: String,
    context: mongoose.Schema.Types.Mixed
  },

  // For Q&A pairs
  question: String,
  answer: String,

  // For examples
  example: {
    input: String,
    output: String,
    scenario: String
  },

  // For context/knowledge
  context: {
    title: String,
    content: String,
    category: String
  },

  // For instructions
  instruction: {
    title: String,
    content: String,
    priority: Number
  },

  // Metadata
  category: String,
  tags: [String],
  language: {
    type: String,
    default: 'en',
    index: true
  },
  priority: {
    type: Number,
    default: 0
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
trainingDataSchema.index({ businessId: 1, type: 1, isActive: 1 });
trainingDataSchema.index({ businessId: 1, category: 1 });
trainingDataSchema.index({ question: 'text', answer: 'text' });
trainingDataSchema.index({ 'conversation.user': 'text', 'conversation.assistant': 'text' });

module.exports = mongoose.model('TrainingData', trainingDataSchema);

