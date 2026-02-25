/**
 * FAQ Model
 * Knowledge base for each business
 */

const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true
  },
  
  // For better matching
  keywords: [String],
  category: String,
  
  // Priority for ordering
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
faqSchema.index({ businessId: 1, isActive: 1 });
faqSchema.index({ businessId: 1, keywords: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);

