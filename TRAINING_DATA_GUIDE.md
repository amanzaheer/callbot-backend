# Bulk Training Data Guide

**Guide to train your bot with bulk data for better conversation quality.**

## 🎯 What is Training Data?

Training data helps your bot understand:
- How to respond to specific questions
- Conversation patterns and examples
- Business-specific context
- Preferred response styles
- Common scenarios and outcomes

---

## 📊 Training Data Types

### 1. Conversation Examples (`type: "conversation"`)

Real conversation examples showing how the bot should respond:

```json
{
  "type": "conversation",
  "conversation": {
    "user": "I want to book a table for 2 people tonight",
    "assistant": "Great! I'd be happy to help you book a table. What time would you prefer?",
    "context": {
      "businessType": "restaurant",
      "scenario": "table_booking"
    }
  },
  "category": "booking",
  "tags": ["table", "reservation", "dinner"]
}
```

### 2. Q&A Pairs (`type: "qa"`)

Question and answer pairs for common questions:

```json
{
  "type": "qa",
  "question": "What are your opening hours?",
  "answer": "We're open Monday to Friday from 9 AM to 6 PM, and Saturday from 10 AM to 4 PM. We're closed on Sundays.",
  "category": "hours",
  "priority": 10
}
```

### 3. Examples (`type: "example"`)

Example scenarios showing expected input/output:

```json
{
  "type": "example",
  "example": {
    "input": "I need an appointment for a checkup",
    "output": "I can help you schedule a checkup. What date works best for you?",
    "scenario": "appointment_booking"
  },
  "category": "appointments"
}
```

### 4. Context (`type: "context"`)

Business-specific context and knowledge:

```json
{
  "type": "context",
  "context": {
    "title": "Payment Methods",
    "content": "We accept cash, credit cards, and digital payments. Payment is due at the time of service.",
    "category": "payment"
  },
  "tags": ["payment", "billing"]
}
```

### 5. Instructions (`type: "instruction"`)

Special instructions for the bot:

```json
{
  "type": "instruction",
  "instruction": {
    "title": "Tone of Voice",
    "content": "Always be friendly and professional. Use simple language. Avoid technical jargon.",
    "priority": 5
  }
}
```

---

## 🚀 Uploading Training Data

### Single Upload (API)

**Endpoint:** `POST /api/businesses/training-data`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "trainingData": [
    {
      "type": "conversation",
      "conversation": {
        "user": "Hello, I need help",
        "assistant": "Hello! I'm here to help. What can I do for you today?"
      },
      "category": "greeting"
    },
    {
      "type": "qa",
      "question": "What services do you offer?",
      "answer": "We offer consultation, treatment, and follow-up services."
    },
    {
      "type": "example",
      "example": {
        "input": "I want to schedule an appointment",
        "output": "I'd be happy to schedule an appointment for you. What date and time work best?",
        "scenario": "scheduling"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 3,
  "errors": 0,
  "trainingData": [...]
}
```

### Bulk Upload (Multiple Items)

You can upload multiple items at once:

```json
{
  "trainingData": [
    {
      "type": "qa",
      "question": "Question 1",
      "answer": "Answer 1"
    },
    {
      "type": "qa",
      "question": "Question 2",
      "answer": "Answer 2"
    },
    {
      "type": "conversation",
      "conversation": {
        "user": "User message",
        "assistant": "Bot response"
      }
    }
    // ... up to 100 items at once
  ]
}
```

---

## 📝 Example: Restaurant Training Data

```json
{
  "trainingData": [
    {
      "type": "conversation",
      "conversation": {
        "user": "I'd like to make a reservation",
        "assistant": "I'd be happy to help you make a reservation! For how many people and what date?"
      },
      "category": "reservations",
      "tags": ["booking", "table"]
    },
    {
      "type": "qa",
      "question": "What's on your menu?",
      "answer": "We offer a variety of Italian dishes including pasta, pizza, salads, and desserts. Would you like me to tell you about our specials?"
    },
    {
      "type": "qa",
      "question": "Do you have vegetarian options?",
      "answer": "Yes! We have several vegetarian options including vegetarian pasta, salads, and pizza. I'd be happy to recommend some dishes."
    },
    {
      "type": "example",
      "example": {
        "input": "What time do you close?",
        "output": "We're open until 10 PM on weekdays and 11 PM on weekends. Is there anything else I can help you with?",
        "scenario": "hours_inquiry"
      },
      "category": "hours"
    },
    {
      "type": "context",
      "context": {
        "title": "Reservation Policy",
        "content": "Reservations can be made up to 30 days in advance. We require a credit card to hold reservations for parties of 6 or more.",
        "category": "policies"
      }
    },
    {
      "type": "instruction",
      "instruction": {
        "title": "Upselling",
        "content": "When customers order, suggest appetizers, drinks, or desserts in a friendly, non-pushy way.",
        "priority": 3
      }
    }
  ]
}
```

---

## 📝 Example: Clinic Training Data

```json
{
  "trainingData": [
    {
      "type": "conversation",
      "conversation": {
        "user": "I need to see a doctor",
        "assistant": "I can help you schedule an appointment. What type of consultation do you need?"
      },
      "category": "appointments"
    },
    {
      "type": "qa",
      "question": "What insurance do you accept?",
      "answer": "We accept most major insurance plans including Blue Cross, Aetna, and UnitedHealthcare. Would you like to verify if your insurance is accepted?"
    },
    {
      "type": "example",
      "example": {
        "input": "I have a fever and cough",
        "output": "I understand you're not feeling well. I can schedule you for a same-day appointment. What time works best for you?",
        "scenario": "urgent_care"
      },
      "category": "symptoms"
    },
    {
      "type": "context",
      "context": {
        "title": "Appointment Cancellation",
        "content": "Appointments must be cancelled at least 24 hours in advance. Late cancellations may incur a fee.",
        "category": "policies"
      }
    }
  ]
}
```

---

## 🔍 Getting Training Data

**Endpoint:** `GET /api/businesses/training-data`

**Query Parameters:**
- `type` - Filter by type (conversation, qa, example, context, instruction)
- `category` - Filter by category
- `includeInactive` - Include inactive items (default: false)
- `limit` - Limit results (default: 100)

**Example:**
```bash
GET /api/businesses/training-data?type=qa&category=hours&limit=50
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "trainingData": [...]
}
```

---

## 🗑️ Deleting Training Data

**Endpoint:** `DELETE /api/businesses/training-data/:trainingDataId`

**Example:**
```bash
DELETE /api/businesses/training-data/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Training data deleted"
}
```

---

## 💡 Best Practices

### 1. Start with Common Questions

Upload Q&A pairs for the most common questions your customers ask.

### 2. Add Conversation Examples

Include real conversation examples showing how the bot should respond in different scenarios.

### 3. Provide Context

Add business-specific context that helps the bot understand your business better.

### 4. Use Categories and Tags

Organize training data with categories and tags for easier management.

### 5. Set Priorities

Use the `priority` field to indicate which training data is most important.

### 6. Regular Updates

Update training data regularly based on:
- New customer questions
- Common conversation patterns
- Business changes
- Customer feedback

---

## 🎯 How Training Data is Used

Training data is automatically integrated into AI prompts:

1. **Intent Analysis** - Helps bot understand user intent better
2. **Response Generation** - Provides examples for how to respond
3. **Context Understanding** - Gives bot business-specific knowledge
4. **Tone & Style** - Helps bot match your preferred communication style

**The bot uses the top 20 most relevant training data items (by priority) for each conversation.**

---

## 📊 Training Data Structure

```javascript
{
  businessId: ObjectId,        // Auto-set
  type: String,                 // conversation, qa, example, context, instruction
  conversation: {               // For type: "conversation"
    user: String,
    assistant: String,
    context: Object
  },
  question: String,             // For type: "qa"
  answer: String,               // For type: "qa"
  example: {                    // For type: "example"
    input: String,
    output: String,
    scenario: String
  },
  context: {                    // For type: "context"
    title: String,
    content: String,
    category: String
  },
  instruction: {                // For type: "instruction"
    title: String,
    content: String,
    priority: Number
  },
  category: String,
  tags: [String],
  priority: Number,             // Higher = more important
  isActive: Boolean             // Can be deactivated
}
```

---

## 🚀 Quick Start

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "password"}'

# 2. Upload training data
curl -X POST http://localhost:3000/api/businesses/training-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainingData": [
      {
        "type": "qa",
        "question": "What are your hours?",
        "answer": "We're open 9 AM to 6 PM Monday to Friday."
      }
    ]
  }'

# 3. Get training data
curl -X GET http://localhost:3000/api/businesses/training-data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Checklist

- [ ] Upload Q&A pairs for common questions
- [ ] Add conversation examples
- [ ] Provide business context
- [ ] Set priorities for important data
- [ ] Use categories and tags
- [ ] Test bot responses
- [ ] Update regularly based on feedback

---

**Your bot will automatically use this training data to provide better, more accurate responses! 🎉**

