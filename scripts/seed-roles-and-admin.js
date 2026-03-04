/**
 * Seed default roles and optional admin user - for be-domain style auth
 * Run: node scripts/seed-roles-and-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const Permission = require('../models/Permission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot';

const defaultPermissions = [
  'view_users',
  'manage_users',
  'view_roles',
  'manage_roles',
  'manage_permissions',
  'view_all_users',
  'view_all_roles',
  'view_all_permissions',
  'portal_setting',
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminRole = await Role.findOne({ type: 'admin' });
    if (!adminRole) {
      await Role.create({
        name: 'SuperAdmin',
        type: 'admin',
        level: 10,
        permissions: defaultPermissions,
        isDeletable: false,
      });
      console.log('Created SuperAdmin role');
    } else {
      console.log('Admin role already exists');
    }

    const userRole = await Role.findOne({ type: 'user' });
    if (!userRole) {
      await Role.create({
        name: 'User',
        type: 'user',
        level: 1,
        permissions: [],
        isDeletable: true,
      });
      console.log('Created User role');
    } else {
      console.log('User role already exists');
    }

    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@callbot.local';

    const existingAdmin = await User.findOne({ username: adminUsername, isDeleted: false });
    if (!existingAdmin) {
      const superAdminRole = await Role.findOne({ type: 'admin', level: 10 });
      if (superAdminRole) {
        await User.create({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          pswrd: adminPassword,
          personalInfo: { firstName: 'Admin', lastName: 'User' },
          roleId: superAdminRole._id,
          verificationStatus: true,
        });
        console.log(`Created admin user: ${adminUsername} / ${adminPassword}`);
        console.log('Change password after first login!');
      }
    } else {
      console.log('Admin user already exists');
    }

    console.log('Seed completed');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
