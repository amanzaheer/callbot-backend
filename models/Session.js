/**
 * Session Model
 * User sessions - copied from be-domain-primetime
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: { type: String, required: false },
    ipAddress: { type: String, required: false },
    lastActive: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: false,
    },
  },
  { timestamps: true, collection: 'userSessions' }
);

module.exports = mongoose.model('Session', sessionSchema);
