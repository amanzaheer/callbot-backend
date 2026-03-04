/**
 * Role Model
 * User merchant role with permissions - copied from be-domain-primetime
 */

const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: ['user', 'developer', 'admin'],
      default: 'user',
    },
    level: {
      type: Number,
      unique: true,
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isDeletable: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
    },
  },
  { timestamps: true, collection: 'roles' }
);

module.exports = mongoose.model('Role', RoleSchema);
