/**
 * Setup Twilio Credentials Script
 * Updates business profile with Twilio credentials from .env
 * 
 * Usage: node scripts/setup-twilio-credentials.js <business-email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('../models/Business');

async function setupTwilioCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot');
    console.log('✅ Connected to MongoDB');

    // Get business email from command line
    const businessEmail = process.argv[2];
    if (!businessEmail) {
      console.error('❌ Please provide business email as argument');
      console.log('Usage: node scripts/setup-twilio-credentials.js your-email@example.com');
      process.exit(1);
    }

    // Check if Twilio credentials are in .env
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('❌ Twilio credentials not found in .env file');
      console.log('Please add to .env:');
      console.log('  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      console.log('  TWILIO_AUTH_TOKEN=your_auth_token');
      console.log('  TWILIO_PHONE_NUMBER=+1234567890');
      process.exit(1);
    }

    // Find business
    const business = await Business.findOne({ email: businessEmail });
    if (!business) {
      console.error(`❌ Business not found with email: ${businessEmail}`);
      console.log('Available businesses:');
      const allBusinesses = await Business.find({}, 'email name');
      allBusinesses.forEach(b => console.log(`  - ${b.email} (${b.name})`));
      process.exit(1);
    }

    // Update business with Twilio credentials
    business.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    business.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    business.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    await business.save();

    console.log('✅ Twilio credentials updated successfully!');
    console.log(`\nBusiness: ${business.name} (${business.email})`);
    console.log(`Twilio Account SID: ${business.twilioAccountSid}`);
    console.log(`Twilio Phone Number: ${business.twilioPhoneNumber}`);
    console.log('\n✅ You can now make calls!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTwilioCredentials();

