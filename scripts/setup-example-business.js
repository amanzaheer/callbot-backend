/**
 * Setup Script
 * Creates an example business with sample services and FAQs
 * Usage: node scripts/setup-example-business.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('../models/Business');
const ServiceDefinition = require('../models/ServiceDefinition');
const FAQ = require('../models/FAQ');
const bcrypt = require('bcryptjs');

async function setupExampleBusiness() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/callbot');
    console.log('Connected to MongoDB');

    // Check if business already exists
    const existingBusiness = await Business.findOne({ email: 'demo@example.com' });
    if (existingBusiness) {
      console.log('Example business already exists. Delete it first if you want to recreate.');
      process.exit(0);
    }

    // Create business
    const password = await bcrypt.hash('demo123', 10);
    const business = await Business.create({
      name: 'Demo Restaurant',
      email: 'demo@example.com',
      password: password,
      phone: '+1234567890',
      businessType: 'restaurant',
      twilioPhoneNumber: '+1234567890',
      conversationSettings: {
        greeting: 'Hello! Welcome to Demo Restaurant. I can help you place an order or make a reservation. How can I assist you today?',
        closing: 'Thank you for choosing Demo Restaurant! Have a great day!'
      },
      aiSettings: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        language: 'en',
        voice: 'alloy'
      }
    });

    console.log('Created business:', business.name);

    // Create services
    const pizzaService = await ServiceDefinition.create({
      businessId: business._id,
      name: 'Pizza Margherita',
      description: 'Classic Italian pizza with tomato, mozzarella, and basil',
      category: 'Pizza',
      workflowType: 'order',
      fields: [
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'number',
          required: true,
          validation: { min: 1, max: 10 },
          order: 1
        },
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          required: true,
          validation: { options: ['small', 'medium', 'large', 'extra-large'] },
          order: 2
        },
        {
          name: 'deliveryAddress',
          label: 'Delivery Address',
          type: 'address',
          required: true,
          order: 3
        }
      ],
      pricing: {
        basePrice: 15.99,
        currency: 'USD',
        variablePricing: true
      }
    });

    const reservationService = await ServiceDefinition.create({
      businessId: business._id,
      name: 'Table Reservation',
      description: 'Reserve a table for dining',
      category: 'Reservations',
      workflowType: 'booking',
      fields: [
        {
          name: 'date',
          label: 'Date',
          type: 'date',
          required: true,
          order: 1
        },
        {
          name: 'time',
          label: 'Time',
          type: 'time',
          required: true,
          order: 2
        },
        {
          name: 'numberOfGuests',
          label: 'Number of Guests',
          type: 'number',
          required: true,
          validation: { min: 1, max: 20 },
          order: 3
        },
        {
          name: 'name',
          label: 'Your Name',
          type: 'text',
          required: true,
          order: 4
        },
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'phone',
          required: true,
          order: 5
        }
      ]
    });

    console.log('Created services:', pizzaService.name, reservationService.name);

    // Create FAQs
    const faqs = await FAQ.insertMany([
      {
        businessId: business._id,
        question: 'What are your opening hours?',
        answer: 'We\'re open Monday through Saturday from 11 AM to 10 PM, and Sunday from 12 PM to 9 PM.',
        keywords: ['hours', 'open', 'time', 'when'],
        category: 'General',
        priority: 1
      },
      {
        businessId: business._id,
        question: 'Do you offer delivery?',
        answer: 'Yes, we offer delivery within a 5-mile radius. Delivery fee is $3.99 and takes approximately 30-45 minutes.',
        keywords: ['delivery', 'deliver', 'takeout'],
        category: 'Services',
        priority: 1
      },
      {
        businessId: business._id,
        question: 'Do you have vegetarian options?',
        answer: 'Absolutely! We have a wide variety of vegetarian pizzas, pasta dishes, and salads.',
        keywords: ['vegetarian', 'veggie', 'vegan', 'dietary'],
        category: 'Menu',
        priority: 2
      }
    ]);

    console.log('Created FAQs:', faqs.length);

    console.log('\n✅ Setup complete!');
    console.log('\nLogin credentials:');
    console.log('Email: demo@example.com');
    console.log('Password: demo123');
    console.log('\nYou can now login and start using the API.');

    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
}

setupExampleBusiness();

