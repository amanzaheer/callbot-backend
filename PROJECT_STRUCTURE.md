# Project Structure

Complete overview of the Universal AI Call Bot Backend architecture.

## Directory Structure

```
callbot-backend/
├── controllers/              # Request handlers
│   ├── adminController.js    # Admin APIs (calls, interactions, analytics)
│   ├── businessController.js # Business management (profile, services, FAQs)
│   └── callController.js     # Call handling (webhooks, speech processing)
│
├── services/                 # Business logic layer
│   ├── ai/
│   │   └── openaiService.js  # OpenAI integration (GPT-4, Whisper, TTS)
│   ├── voice/
│   │   └── twilioService.js  # Twilio API (calls, TwiML generation)
│   ├── call/
│   │   └── callSessionService.js # Call session lifecycle management
│   ├── conversation/
│   │   └── conversationOrchestrator.js # Main conversation engine
│   └── workflow/
│       └── workflowEngine.js # Dynamic workflow and data collection
│
├── models/                   # MongoDB schemas
│   ├── Business.js           # Business configuration
│   ├── ServiceDefinition.js  # Dynamic service definitions
│   ├── FAQ.js                # Knowledge base
│   ├── CallSession.js        # Call session tracking
│   ├── ConversationMessage.js # Conversation transcript
│   ├── InteractionRecord.js  # Finalized orders/bookings/leads
│   ├── Customer.js           # Customer information
│   └── CallRecording.js     # Call recording metadata
│
├── routes/                   # Express routes
│   ├── auth.js              # Authentication routes
│   ├── business.js          # Business management routes
│   ├── calls.js             # Call handling routes
│   └── admin.js             # Admin API routes
│
├── middlewares/              # Express middlewares
│   ├── auth.js              # JWT authentication
│   └── errorHandler.js      # Global error handling
│
├── utils/                    # Utilities
│   └── logger.js            # Winston logger configuration
│
├── examples/                 # Example configurations
│   └── configurations/
│       ├── restaurant.json   # Restaurant example
│       ├── clinic.json       # Medical clinic example
│       └── real_estate.json  # Real estate example
│
├── scripts/                  # Utility scripts
│   └── setup-example-business.js # Demo setup script
│
├── server.js                 # Main application entry point
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── README.md                 # Main documentation
├── DEPLOYMENT.md             # Deployment guide
├── API_EXAMPLES.md           # API usage examples
└── PROJECT_STRUCTURE.md      # This file
```

## Core Components

### 1. Models (Database Layer)

**Business Model**
- Stores business profile and configuration
- AI settings (model, temperature, voice)
- Conversation settings (greeting, closing)
- Twilio credentials
- Operating hours

**ServiceDefinition Model**
- Dynamic service/product definitions
- Field schemas (type, validation, required)
- Pricing rules
- Workflow type (order, booking, etc.)
- Availability rules

**CallSession Model**
- Tracks each phone call
- Current state (greeting, collecting-data, confirming, etc.)
- Collected data (dynamic structure)
- Detected intent
- Missing required fields

**ConversationMessage Model**
- Full conversation transcript
- AI analysis results
- Timestamps and sequence

**InteractionRecord Model**
- Finalized orders/bookings/leads
- Structured data based on service
- Pricing information
- Status tracking

### 2. Services (Business Logic)

**OpenAI Service**
- Speech-to-Text (Whisper)
- Text-to-Speech
- LLM conversation generation
- Intent detection and entity extraction

**Twilio Service**
- Make/receive calls
- Generate TwiML responses
- Handle call recordings
- Call transfer

**Call Session Service**
- Create/update call sessions
- Manage conversation state
- Store messages
- Track collected data

**Conversation Orchestrator**
- Main conversation engine
- Coordinates AI, workflow, and call handling
- Handles different conversation states
- Finalizes interactions

**Workflow Engine**
- Validates collected data
- Calculates pricing
- Creates interaction records
- Manages field collection flow

### 3. Controllers (Request Handlers)

**Call Controller**
- Handles Twilio webhooks
- Processes speech input
- Manages call status updates
- Handles recording callbacks

**Business Controller**
- Business registration/login
- Profile management
- Service CRUD operations
- FAQ management

**Admin Controller**
- View calls and transcripts
- View interaction records
- Customer management
- Analytics and reporting
- Data export

### 4. Routes (API Endpoints)

**Authentication Routes** (`/api/auth`)
- POST `/register` - Register business
- POST `/login` - Login

**Business Routes** (`/api/businesses`)
- GET `/profile` - Get profile
- PUT `/profile` - Update profile
- POST `/services` - Create service
- GET `/services` - List services
- PUT `/services/:id` - Update service
- DELETE `/services/:id` - Delete service
- POST `/faqs` - Create FAQ
- GET `/faqs` - List FAQs
- PUT `/faqs/:id` - Update FAQ
- DELETE `/faqs/:id` - Delete FAQ

**Call Routes** (`/api/calls`)
- POST `/webhook` - Twilio incoming call
- POST `/process-speech/:callSessionId` - Process speech
- POST `/status` - Call status update
- POST `/recording-status` - Recording status
- POST `/outgoing` - Make outgoing call

**Admin Routes** (`/api/admin`)
- GET `/calls` - List calls
- GET `/calls/:id` - Get call details
- GET `/interactions` - List interactions
- GET `/customers` - List customers
- GET `/analytics` - Get analytics
- GET `/export` - Export data

## Data Flow

### Incoming Call Flow

1. **Twilio Webhook** → `POST /api/calls/webhook`
2. **Call Controller** → Creates CallSession
3. **TwiML Response** → Greeting with speech gathering
4. **User Speaks** → `POST /api/calls/process-speech/:id`
5. **Conversation Orchestrator** → Processes input
6. **AI Service** → Analyzes intent and extracts entities
7. **Workflow Engine** → Validates and collects data
8. **State Management** → Updates call state
9. **TwiML Response** → Next question or confirmation
10. **Finalization** → Creates InteractionRecord on confirmation

### Configuration Flow

1. **Business Registration** → Creates Business record
2. **Service Definition** → Defines fields and workflow
3. **FAQ Creation** → Adds knowledge base
4. **AI Configuration** → Sets model, voice, language
5. **Ready** → System can handle calls

## Key Design Principles

1. **Configuration-Driven**: No hard-coded business logic
2. **Universal Schema**: Works for any business type
3. **Dynamic Fields**: Service definitions define data structure
4. **State Machine**: Clear conversation states
5. **Separation of Concerns**: Models, Services, Controllers, Routes
6. **Error Handling**: Comprehensive error handling and logging
7. **Security**: JWT auth, rate limiting, input validation
8. **Scalability**: Stateless design, horizontal scaling ready

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Voice**: Twilio (calls, recordings)
- **AI**: OpenAI (GPT-4, Whisper, TTS)
- **WebSockets**: Socket.IO (real-time updates)
- **Authentication**: JWT
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Extension Points

To extend the system:

1. **New Field Types**: Add to `ServiceDefinition` field type enum
2. **New Workflow Types**: Add to workflow type enum
3. **Custom Validation**: Extend `workflowEngine.validateField()`
4. **Custom Pricing**: Extend `workflowEngine.calculatePricing()`
5. **New AI Providers**: Create new service in `services/ai/`
6. **New Voice Providers**: Create new service in `services/voice/`
7. **Custom Analytics**: Extend `adminController.getAnalytics()`

## Testing Strategy

1. **Unit Tests**: Test services independently
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test full call flow
4. **Load Tests**: Test under high call volume

## Monitoring

- **Logs**: Winston logger (error.log, combined.log)
- **Health Check**: `GET /health`
- **Metrics**: Call counts, durations, success rates
- **Errors**: Tracked in CallSession.errors array

---

**Architecture designed for flexibility, scalability, and maintainability!** 🏗️

