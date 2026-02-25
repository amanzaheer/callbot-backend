/**
 * InteractionRecord Model
 * Stores finalized orders, bookings, leads, etc.
 * Universal schema that works for any business type
 */

const mongoose = require('mongoose');

const interactionRecordSchema = new mongoose.Schema({
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
    index: true
  },
  
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceDefinition',
    index: true
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  
  // Record Type
  recordType: {
    type: String,
    required: true,
    enum: ['order', 'booking', 'inquiry', 'lead', 'complaint', 'support', 'custom'],
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // All collected data (dynamic structure)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Pricing (if applicable)
  pricing: {
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Confirmation
  confirmedAt: Date,
  confirmedBy: String, // 'customer' or 'system'
  
  // Notes
  notes: String,
  internalNotes: String,
  
  // Follow-up
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
interactionRecordSchema.index({ businessId: 1, status: 1 });
interactionRecordSchema.index({ businessId: 1, recordType: 1 });
interactionRecordSchema.index({ businessId: 1, createdAt: -1 });
interactionRecordSchema.index({ customerId: 1 });
interactionRecordSchema.index({ callSessionId: 1 });

module.exports = mongoose.model('InteractionRecord', interactionRecordSchema);

