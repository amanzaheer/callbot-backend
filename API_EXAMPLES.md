# API Usage Examples

Complete examples for using the Universal AI Call Bot API.

## Authentication

### Register Business
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Restaurant",
    "email": "restaurant@example.com",
    "password": "securepassword123",
    "phone": "+1234567890",
    "businessType": "restaurant"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "business": {
    "id": "507f1f77bcf86cd799439011",
    "name": "My Restaurant",
    "email": "restaurant@example.com",
    "businessType": "restaurant"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "restaurant@example.com",
    "password": "securepassword123"
  }'
```

## Business Configuration

### Get Profile
```bash
curl -X GET http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/businesses/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationSettings": {
      "greeting": "Hello! Welcome to My Restaurant.",
      "closing": "Thank you for calling!"
    },
    "aiSettings": {
      "voice": "alloy",
      "language": "en"
    }
  }'
```

## Service Management

### Create Service (Restaurant Order)
```bash
curl -X POST http://localhost:3000/api/businesses/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Order",
    "description": "Order a delicious pizza",
    "category": "Pizza",
    "workflowType": "order",
    "fields": [
      {
        "name": "quantity",
        "label": "How many pizzas?",
        "type": "number",
        "required": true,
        "validation": {
          "min": 1,
          "max": 10
        },
        "order": 1
      },
      {
        "name": "size",
        "label": "What size?",
        "type": "select",
        "required": true,
        "validation": {
          "options": ["small", "medium", "large", "extra-large"]
        },
        "order": 2
      },
      {
        "name": "toppings",
        "label": "Any additional toppings?",
        "type": "multiselect",
        "required": false,
        "validation": {
          "options": ["pepperoni", "mushrooms", "olives", "extra cheese"]
        },
        "order": 3
      },
      {
        "name": "deliveryAddress",
        "label": "Delivery address",
        "type": "address",
        "required": true,
        "order": 4
      }
    ],
    "pricing": {
      "basePrice": 15.99,
      "currency": "USD",
      "variablePricing": true,
      "pricingRules": {
        "quantityMultiplier": true,
        "fieldBasedPricing": {
          "size": {
            "small": 0,
            "medium": 3,
            "large": 6,
            "extra-large": 10
          }
        }
      }
    }
  }'
```

### Create Service (Appointment Booking)
```bash
curl -X POST http://localhost:3000/api/businesses/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Doctor Appointment",
    "description": "Schedule a consultation",
    "category": "Consultations",
    "workflowType": "booking",
    "fields": [
      {
        "name": "date",
        "label": "Preferred date",
        "type": "date",
        "required": true,
        "order": 1
      },
      {
        "name": "time",
        "label": "Preferred time",
        "type": "time",
        "required": true,
        "order": 2
      },
      {
        "name": "name",
        "label": "Patient name",
        "type": "text",
        "required": true,
        "order": 3
      },
      {
        "name": "phone",
        "label": "Phone number",
        "type": "phone",
        "required": true,
        "order": 4
      },
      {
        "name": "reason",
        "label": "Reason for visit",
        "type": "textarea",
        "required": false,
        "order": 5
      }
    ],
    "pricing": {
      "basePrice": 150,
      "currency": "USD"
    },
    "availability": {
      "enabled": true,
      "maxBookingsPerSlot": 1,
      "advanceBookingDays": 90
    }
  }'
```

### Get All Services
```bash
curl -X GET http://localhost:3000/api/businesses/services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Service
```bash
curl -X PUT http://localhost:3000/api/businesses/services/SERVICE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricing": {
      "basePrice": 19.99
    }
  }'
```

## FAQ Management

### Create FAQ
```bash
curl -X POST http://localhost:3000/api/businesses/faqs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are your opening hours?",
    "answer": "We are open Monday through Saturday from 11 AM to 10 PM.",
    "keywords": ["hours", "open", "time", "when"],
    "category": "General",
    "priority": 1
  }'
```

### Get All FAQs
```bash
curl -X GET http://localhost:3000/api/businesses/faqs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Call Management

### Make Outgoing Call
```bash
curl -X POST http://localhost:3000/api/calls/outgoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1987654321",
    "serviceId": "SERVICE_ID_OPTIONAL"
  }'
```

## Admin APIs

### Get All Calls
```bash
curl -X GET "http://localhost:3000/api/admin/calls?status=completed&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Query Parameters:**
- `status`: Filter by call status
- `intent`: Filter by detected intent
- `startDate`: Filter calls from date (ISO format)
- `endDate`: Filter calls to date (ISO format)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Get Call Details with Transcript
```bash
curl -X GET http://localhost:3000/api/admin/calls/CALL_SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response includes:**
- Call metadata
- Full conversation transcript
- Recording information
- Collected data
- Interaction record (if finalized)

### Get Interaction Records
```bash
curl -X GET "http://localhost:3000/api/admin/interactions?recordType=order&status=confirmed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Customers
```bash
curl -X GET "http://localhost:3000/api/admin/customers?page=1&limit=20&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Analytics
```bash
curl -X GET "http://localhost:3000/api/admin/analytics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "calls": {
      "total": 150,
      "completed": 120,
      "completionRate": "80.00",
      "avgDuration": 245
    },
    "intents": [
      { "_id": "order", "count": 50 },
      { "_id": "booking", "count": 40 },
      { "_id": "inquiry", "count": 30 }
    ],
    "interactions": {
      "total": 100,
      "confirmed": 85,
      "confirmationRate": "85.00"
    },
    "recordTypes": [
      { "_id": "order", "count": 50 },
      { "_id": "booking", "count": 35 }
    ]
  }
}
```

### Export Data
```bash
curl -X GET "http://localhost:3000/api/admin/export?type=calls&startDate=2024-01-01" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o calls-export.json
```

**Export Types:**
- `calls`: All call sessions
- `interactions`: All interaction records
- `customers`: All customers

## Field Types Reference

### Supported Field Types:
- `text`: Plain text input
- `number`: Numeric input
- `date`: Date input (YYYY-MM-DD)
- `time`: Time input (HH:MM)
- `datetime`: Date and time
- `email`: Email address
- `phone`: Phone number
- `select`: Single selection dropdown
- `multiselect`: Multiple selection
- `boolean`: Yes/No checkbox
- `address`: Full address
- `textarea`: Multi-line text

### Field Validation Options:
```json
{
  "validation": {
    "pattern": "^[A-Za-z]+$",  // Regex pattern
    "min": 1,                   // Minimum value (for numbers)
    "max": 100,                 // Maximum value (for numbers)
    "minLength": 3,             // Minimum length (for strings)
    "maxLength": 50,            // Maximum length (for strings)
    "options": ["option1", "option2"]  // For select/multiselect
  }
}
```

## Workflow Types

- `order`: For placing orders (restaurants, ecommerce)
- `booking`: For appointments/reservations (clinics, salons, restaurants)
- `inquiry`: For general information requests
- `lead`: For lead generation (real estate, sales)
- `complaint`: For handling complaints
- `support`: For customer support
- `custom`: For custom workflows

## Complete Example: Restaurant Setup

```bash
# 1. Register
TOKEN=$(curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Pizza Place","email":"pizza@example.com","password":"pass123","phone":"+1234567890","businessType":"restaurant"}' \
  | jq -r '.token')

# 2. Create Pizza Order Service
curl -X POST http://localhost:3000/api/businesses/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @examples/configurations/restaurant.json

# 3. Add FAQs
curl -X POST http://localhost:3000/api/businesses/faqs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"What are your hours?","answer":"9 AM to 9 PM daily","keywords":["hours"]}'

# 4. View calls (after receiving calls)
curl -X GET http://localhost:3000/api/admin/calls \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Connection (Real-time Updates)

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
  
  // Join a call room for real-time updates
  socket.emit('join-call', 'CALL_SESSION_ID');
});

socket.on('call-update', (data) => {
  console.log('Call update:', data);
});
```

---

**Ready to use!** Configure your business and start receiving AI-powered calls! 🚀

