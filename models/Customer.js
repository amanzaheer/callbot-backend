/**
 * Customer Model
 * Stores customer information across calls
 */

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  
  // Contact Information
  phone: {
    type: String,
    required: true,
    index: true
  },
  email: String,
  name: String,
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Preferences
  preferences: mongoose.Schema.Types.Mixed,
  
  // History
  totalCalls: {
    type: Number,
    default: 0
  },
  totalInteractions: {
    type: Number,
    default: 0
  },
  lastInteractionAt: Date,
  
  // Tags
  tags: [String],
  
  // Notes
  notes: String,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique customer per business
customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);

