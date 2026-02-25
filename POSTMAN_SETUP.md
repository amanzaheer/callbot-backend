# Postman Collection Setup Guide

Complete guide to import and use the Postman collection for testing the Universal AI Call Bot API.

## 📥 Import Collection

### Method 1: Import from File

1. **Open Postman**
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select: `postman/CallBot_API.postman_collection.json`
5. Click **Import**

### Method 2: Import from URL (if hosted)

1. Click **Import**
2. Paste the collection URL
3. Click **Import**

## 🌍 Import Environment

1. Click **Import** in Postman
2. Select: `postman/CallBot_Environment.postman_environment.json`
3. Click **Import**
4. Select the environment from the dropdown (top right): **"CallBot - Local Development"**

## ⚙️ Configure Environment Variables

The environment includes these variables:

- `base_url` - API base URL (default: `http://localhost:3000`)
- `auth_token` - JWT token (auto-set after login/register)
- `business_id` - Business ID (auto-set after login/register)
- `service_id` - Service ID (set manually from responses)
- `faq_id` - FAQ ID (set manually from responses)
- `call_id` - Call Session ID (set manually from responses)

### Update Base URL for Production:

1. Click environment dropdown (top right)
2. Click **Edit** (pencil icon)
3. Update `base_url` to your production URL
4. Click **Save**

## 🚀 Quick Start Testing

### Step 1: Health Check
1. Open **Health Check** request
2. Click **Send**
3. Should return: `{"status":"ok","timestamp":"..."}`

### Step 2: Register Business
1. Open **Authentication → Register Business**
2. Update email/password if needed
3. Click **Send**
4. Token is automatically saved to environment

### Step 3: Create Service
1. Open **Services → Create Service - Order**
2. Click **Send**
3. Copy `_id` from response and update `service_id` in environment (optional)

### Step 4: Add FAQ
1. Open **FAQs → Create FAQ**
2. Click **Send**

### Step 5: View Calls
1. After making/receiving calls, open **Admin - Calls → Get All Calls**
2. Click **Send**
3. Copy a `callId` and use in **Get Call Details**

## 📋 Collection Structure

```
Universal AI Call Bot API
├── Authentication
│   ├── Register Business (auto-saves token)
│   └── Login (auto-saves token)
├── Business Management
│   ├── Get Profile
│   └── Update Profile
├── Services
│   ├── Create Service - Order
│   ├── Create Service - Booking
│   ├── Get All Services
│   ├── Update Service
│   └── Delete Service
├── FAQs
│   ├── Create FAQ
│   ├── Get All FAQs
│   ├── Update FAQ
│   └── Delete FAQ
├── Calls
│   └── Make Outgoing Call
├── Admin - Calls
│   ├── Get All Calls (with filters)
│   └── Get Call Details (with transcript)
├── Admin - Interactions
│   └── Get All Interactions
├── Admin - Customers
│   └── Get All Customers
├── Admin - Analytics
│   └── Get Analytics
├── Admin - Export
│   ├── Export Calls
│   ├── Export Interactions
│   └── Export Customers
└── Health Check
```

## 🔑 Authentication Flow

The collection automatically handles authentication:

1. **Register/Login** requests have a **Test** script that:
   - Extracts token from response
   - Saves to `auth_token` environment variable
   - Saves business ID to `business_id`

2. All protected requests use:
   - **Bearer Token** authentication
   - Automatically uses `{{auth_token}}` from environment

## 📝 Example Workflows

### Complete Setup Workflow

1. ✅ **Health Check** - Verify server is running
2. ✅ **Register Business** - Create account
3. ✅ **Update Profile** - Configure settings
4. ✅ **Create Service - Order** - Add pizza order service
5. ✅ **Create Service - Booking** - Add reservation service
6. ✅ **Create FAQ** - Add common questions
7. ✅ **Get All Services** - Verify services created

### Testing Call Flow

1. ✅ **Make Outgoing Call** - Initiate a test call
2. ✅ **Get All Calls** - View call list
3. ✅ **Get Call Details** - View transcript and data
4. ✅ **Get Analytics** - View statistics

### Admin Workflow

1. ✅ **Get All Calls** - View all calls
2. ✅ **Get All Interactions** - View orders/bookings
3. ✅ **Get All Customers** - View customer list
4. ✅ **Get Analytics** - Dashboard data
5. ✅ **Export Calls** - Download call data

## 🎯 Tips & Tricks

### Auto-Save IDs

To auto-save IDs from responses, add this to **Tests** tab:

```javascript
// For Service ID
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    if (jsonData.service && jsonData.service._id) {
        pm.environment.set("service_id", jsonData.service._id);
    }
}

// For FAQ ID
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    if (jsonData.faq && jsonData.faq._id) {
        pm.environment.set("faq_id", jsonData.faq._id);
    }
}

// For Call ID
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.calls && jsonData.calls[0] && jsonData.calls[0]._id) {
        pm.environment.set("call_id", jsonData.calls[0]._id);
    }
}
```

### Use Variables in Requests

You can use environment variables in request bodies:

```json
{
    "serviceId": "{{service_id}}",
    "to": "+1234567890"
}
```

### Filter Examples

**Get calls from last 7 days:**
```
GET /api/admin/calls?startDate=2024-01-01&endDate=2024-01-07
```

**Get confirmed orders:**
```
GET /api/admin/interactions?recordType=order&status=confirmed
```

**Search customers:**
```
GET /api/admin/customers?search=john
```

## 🐛 Troubleshooting

### Token Not Saving

- Check **Tests** tab in Register/Login requests
- Verify environment is selected (top right dropdown)
- Manually set token: Click environment → Edit → Set `auth_token`

### 401 Unauthorized

- Token might be expired (default: 7 days)
- Re-run **Login** request to get new token
- Check token is set in environment

### 404 Not Found

- Verify `base_url` is correct
- Check server is running: `npm start`
- Test with **Health Check** first

### CORS Errors

- Make sure CORS_ORIGIN in `.env` includes your Postman origin
- For development: `CORS_ORIGIN=*`

## 📊 Response Examples

### Register Response
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

### Get Calls Response
```json
{
    "success": true,
    "calls": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "from": "+1234567890",
            "to": "+1987654321",
            "status": "completed",
            "detectedIntent": "order",
            "duration": 245
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 50,
        "pages": 3
    }
}
```

### Analytics Response
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
            { "_id": "booking", "count": 40 }
        ],
        "interactions": {
            "total": 100,
            "confirmed": 85,
            "confirmationRate": "85.00"
        }
    }
}
```

## 🚀 Next Steps

1. ✅ Import collection and environment
2. ✅ Run Health Check
3. ✅ Register/Login
4. ✅ Create services and FAQs
5. ✅ Test API endpoints
6. ✅ Make test calls
7. ✅ View analytics

---

**Happy Testing!** 🎉

For API documentation, see `API_EXAMPLES.md`

