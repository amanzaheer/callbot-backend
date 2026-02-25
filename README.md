# Universal AI Voice Call Bot Backend

A complete, production-ready backend system for a universal AI voice call bot that can be configured for **any type of business** without code changes. The system is fully dynamic and configuration-driven.

## 🎯 Features

- **Multi-Tenant Architecture**: Each business has its own configuration
- **Dynamic Service Definitions**: Define services/products with custom fields
- **AI-Powered Conversations**: Uses OpenAI GPT-4 for natural language understanding
- **Speech-to-Text & Text-to-Speech**: Full voice interaction via Twilio
- **Flexible Workflows**: Supports orders, bookings, inquiries, leads, complaints, and more
- **Call Recording**: Automatic recording and transcript storage
- **Real-time Updates**: WebSocket support for live call monitoring
- **Comprehensive Admin APIs**: View calls, transcripts, analytics, and export data
- **Universal Schema**: Works for restaurants, clinics, real estate, ecommerce, and any other business type

## 🏗️ Architecture

```
callbot-backend/
├── controllers/          # Request handlers
├── services/            # Business logic
│   ├── ai/             # AI/LLM services
│   ├── voice/          # Twilio integration
│   ├── call/           # Call session management
│   ├── conversation/   # Conversation orchestration
│   └── workflow/       # Dynamic workflow engine
├── models/             # MongoDB schemas
├── routes/             # Express routes
├── middlewares/        # Auth, error handling
├── utils/              # Utilities (logger, etc.)
└── examples/           # Sample configurations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- Twilio account with phone number
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start MongoDB:**
```bash
# Make sure MongoDB is running
mongod
```

4. **Start the server:**
```bash
npm start
# or for development
npm run dev
```

The server will start on `http://localhost:3000`

## 📋 Environment Variables

See `.env.example` for all required variables:

- `MONGODB_URI`: MongoDB connection string
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET`: Secret for JWT tokens

## 🔧 Configuration

### 1. Register a Business

```bash
POST /api/auth/register
{
  "name": "My Business",
  "email": "business@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "businessType": "restaurant"
}
```

### 2. Create Service Definitions

```bash
POST /api/businesses/services
Authorization: Bearer <token>
{
  "name": "Pizza Order",
  "description": "Order a pizza",
  "workflowType": "order",
  "fields": [
    {
      "name": "quantity",
      "label": "How many pizzas?",
      "type": "number",
      "required": true,
      "validation": { "min": 1, "max": 10 }
    },
    {
      "name": "size",
      "label": "What size?",
      "type": "select",
      "required": true,
      "validation": {
        "options": ["small", "medium", "large"]
      }
    }
  ],
  "pricing": {
    "basePrice": 15.99,
    "currency": "USD"
  }
}
```

### 3. Add FAQs

```bash
POST /api/businesses/faqs
Authorization: Bearer <token>
{
  "question": "What are your hours?",
  "answer": "We're open 9 AM to 9 PM daily.",
  "keywords": ["hours", "open", "time"]
}
```

### 4. Configure Twilio Webhook

In your Twilio console, set the webhook URL for incoming calls to:
```
https://yourdomain.com/api/calls/webhook
```

## 📞 Call Flow

1. **Incoming Call**: Twilio sends webhook → System creates CallSession
2. **Greeting**: AI greets caller based on business configuration
3. **Intent Detection**: AI analyzes user input to determine intent
4. **Service Selection**: If applicable, matches to a service definition
5. **Data Collection**: Dynamically collects required fields based on service
6. **Validation**: Validates collected data against field definitions
7. **Confirmation**: Summarizes data and asks for confirmation
8. **Finalization**: Creates InteractionRecord on confirmation
9. **Recording**: Call recording stored and linked to session

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new business
- `POST /api/auth/login` - Login

### Business Management
- `GET /api/businesses/profile` - Get business profile
- `PUT /api/businesses/profile` - Update profile
- `POST /api/businesses/services` - Create service
- `GET /api/businesses/services` - List services
- `PUT /api/businesses/services/:id` - Update service
- `DELETE /api/businesses/services/:id` - Delete service
- `POST /api/businesses/faqs` - Create FAQ
- `GET /api/businesses/faqs` - List FAQs

### Call Management
- `POST /api/calls/webhook` - Twilio incoming call webhook
- `POST /api/calls/process-speech/:callSessionId` - Process speech input
- `POST /api/calls/outgoing` - Make outgoing call

### Admin APIs
- `GET /api/admin/calls` - List all calls (with filters)
- `GET /api/admin/calls/:id` - Get call details with transcript
- `GET /api/admin/interactions` - List interaction records
- `GET /api/admin/customers` - List customers
- `GET /api/admin/analytics` - Get analytics dashboard data
- `GET /api/admin/export?type=calls` - Export data (JSON)

## 📊 Database Schemas

### Business
- Business profile, settings, AI configuration
- Twilio credentials
- Conversation settings

### ServiceDefinition
- Dynamic service/product definitions
- Custom field schemas
- Pricing rules
- Workflow type (order, booking, inquiry, etc.)

### CallSession
- Call metadata
- Current state
- Collected data
- Detected intent

### ConversationMessage
- Full conversation transcript
- AI analysis results
- Timestamps

### InteractionRecord
- Finalized orders/bookings/leads
- Structured data
- Status tracking

### Customer
- Customer information
- Interaction history
- Preferences

### CallRecording
- Recording metadata
- URLs and storage info

## 🎨 Example Configurations

See `examples/configurations/` for complete examples:
- `restaurant.json` - Restaurant with orders and reservations
- `clinic.json` - Medical clinic with appointment booking
- `real_estate.json` - Real estate with property viewings and lead generation

## 🔒 Security

- JWT authentication for API access
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation
- Multi-tenant data isolation

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure MongoDB replica set
4. Set up proper CORS origins
5. Use HTTPS for webhooks
6. Configure Twilio webhook URLs
7. Set up monitoring and logging
8. Configure backup strategy

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📝 Notes

- The system is **fully configuration-driven** - no code changes needed for different business types
- All business logic is dynamic based on service definitions
- Field types supported: text, number, date, time, email, phone, select, multiselect, boolean, address, textarea
- Workflow types: order, booking, inquiry, lead, complaint, support, custom
- AI uses GPT-4 with JSON mode for structured responses
- Call recordings are stored via Twilio and linked to sessions

## 🤝 Contributing

This is a production-ready system. For enhancements:
1. Maintain the configuration-driven architecture
2. Keep schemas flexible and universal
3. Add comprehensive error handling
4. Update documentation

## 📄 License

ISC

---

**Built for universal business automation** - Configure once, use anywhere! 🚀

