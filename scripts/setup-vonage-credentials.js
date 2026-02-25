/**
 * Setup Vonage Credentials Script
 * Updates business profile with Vonage credentials from .env
 * 
 * Usage: node scripts/setup-vonage-credentials.js <business-email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('../models/Business');

async function setupVonageCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot');
    console.log('✅ Connected to MongoDB');

    // Get business email from command line
    const businessEmail = process.argv[2];
    if (!businessEmail) {
      console.error('❌ Please provide business email as argument');
      console.log('Usage: node scripts/setup-vonage-credentials.js your-email@example.com');
      process.exit(1);
    }

    // Check if Vonage credentials are in .env
    if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET || !process.env.VONAGE_PHONE_NUMBER) {
      console.error('❌ Vonage credentials not found in .env file');
      console.log('Please add to .env:');
      console.log('  VONAGE_API_KEY=your_api_key');
      console.log('  VONAGE_API_SECRET=your_api_secret');
      console.log('  VONAGE_PHONE_NUMBER=+1234567890');
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

    // Update business with Vonage credentials
    business.voiceProvider = 'vonage';
    business.vonageApiKey = process.env.VONAGE_API_KEY;
    business.vonageApiSecret = process.env.VONAGE_API_SECRET;
    business.vonagePhoneNumber = process.env.VONAGE_PHONE_NUMBER;

    await business.save();

    console.log('✅ Vonage credentials updated successfully!');
    console.log(`\nBusiness: ${business.name} (${business.email})`);
    console.log(`Voice Provider: ${business.voiceProvider}`);
    console.log(`Vonage API Key: ${business.vonageApiKey}`);
    console.log(`Vonage Phone Number: ${business.vonagePhoneNumber}`);
    console.log('\n✅ You can now make calls with Vonage!');
    console.log('\nNext steps:');
    console.log('1. Create application in Vonage dashboard');
    console.log('2. Link phone number to application');
    console.log('3. Configure webhook URLs');
    console.log('4. Start making calls!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupVonageCredentials();

