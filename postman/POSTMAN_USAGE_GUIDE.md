# Postman Collection Usage Guide

## 📦 Import Collection

1. **Open Postman**
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `CallBot_API_Complete.postman_collection.json`
5. Click **Import**

## 🌍 Setup Environment

1. Click **Environments** in left sidebar
2. Click **Import** and select `CallBot_Environment.postman_environment.json`
3. Or create a new environment with these variables:
   - `base_url`: `http://localhost:3000` (or your server URL)
   - `auth_token`: (will be auto-filled after login)
   - `business_id`: (will be auto-filled after login)

4. **Select the environment** from dropdown (top right)

## 🚀 Quick Start

### Step 1: Register or Login

1. Go to **Authentication** folder
2. Use **Register Business** or **Login**
3. The `auth_token` will be automatically saved to environment

### Step 2: Update Profile (Optional)

1. Go to **Business Management** folder
2. Use **Update Profile - Vonage Setup** to add Vonage credentials
3. Or use **Update Profile - General** for other settings

### Step 3: Create Services

1. Go to **Services** folder
2. Use **Create Service - Order** or **Create Service - Booking**
3. Copy the `serviceId` from response for later use

### Step 4: Upload Training Data

1. Go to **Training Data** folder
2. Use **Upload Training Data - Bulk** to train your bot
3. You can upload multiple types at once (Q&A, conversations, examples, etc.)

### Step 5: Make Calls

1. Go to **Calls** folder
2. Use **Make Outgoing Call** to call a user
3. Or call your Vonage number directly (inbound call)

## 📋 Collection Structure

### Authentication
- Register Business
- Login (auto-saves token)

### Business Management
- Get Profile
- Update Profile - General
- Update Profile - Vonage Setup
- Update Profile - Twilio Setup

### Services
- Create Service - Order
- Create Service - Booking
- Get All Services
- Update Service
- Delete Service

### FAQs
- Create FAQ
- Get All FAQs
- Update FAQ
- Delete FAQ

### Training Data ⭐ NEW
- Upload Training Data - Bulk
- Get Training Data
- Delete Training Data

### Calls
- Make Outgoing Call

### Test Calls
- Start Test Call
- Send Test Input
- Get Test Call Status
- End Test Call

### Admin - Calls
- Get All Calls (with filters)
- Get Call Details

### Admin - Interactions
- Get All Interactions

### Admin - Customers
- Get All Customers

### Admin - Analytics
- Get Analytics

### Admin - Export
- Export Calls
- Export Interactions
- Export Customers

### Health Check
- Health Check (no auth needed)

## 🔑 Authentication

Most endpoints require authentication. The collection uses **Bearer Token** authentication.

**Auto-save:** Login and Register endpoints automatically save the token to `auth_token` variable.

**Manual setup:** If needed, set `auth_token` in environment variables.

## 📝 Important Notes

### Phone Number Format
Always use **E.164 format** for phone numbers:
- ✅ `+923219296932`
- ✅ `+1234567890`
- ❌ `923219296932` (missing +)
- ❌ `00923219296932`

### Variables
The collection uses these variables:
- `{{base_url}}` - Your server URL
- `{{auth_token}}` - JWT token (auto-filled)
- `{{business_id}}` - Business ID (auto-filled)
- `:serviceId` - Service ID (replace with actual ID)
- `:faqId` - FAQ ID (replace with actual ID)
- `:callSessionId` - Call Session ID (replace with actual ID)
- `:trainingDataId` - Training Data ID (replace with actual ID)
- `:callId` - Call ID (replace with actual ID)

### Training Data Types
When uploading training data, you can use these types:
- `qa` - Question and answer pairs
- `conversation` - Conversation examples
- `example` - Input/output scenarios
- `context` - Business context/knowledge
- `instruction` - Special instructions

## 🧪 Testing Workflow

### Complete Test Flow:

1. **Register/Login**
   ```
   POST /api/auth/login
   ```

2. **Update Profile with Vonage**
   ```
   PUT /api/businesses/profile
   {
     "voiceProvider": "vonage",
     "vonageApiKey": "...",
     "vonageApiSecret": "...",
     "vonagePhoneNumber": "+..."
   }
   ```

3. **Create a Service**
   ```
   POST /api/businesses/services
   ```

4. **Upload Training Data**
   ```
   POST /api/businesses/training-data
   ```

5. **Make a Call**
   ```
   POST /api/calls/outgoing
   {
     "to": "+923219296932"
   }
   ```

6. **View Call Details**
   ```
   GET /api/admin/calls/:callId
   ```

## 🔍 Tips

1. **Use Test Calls** for development (no real phone needed)
2. **Check Health** endpoint first to verify server is running
3. **Save IDs** from responses for use in other requests
4. **Use Filters** in admin endpoints to narrow results
5. **Export Data** for backup or analysis

## 🐛 Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in
- Check `auth_token` is set in environment
- Token might be expired - login again

### "Not Found" Error
- Check the ID you're using is correct
- Make sure the resource exists
- Verify `base_url` is correct

### "Validation Error"
- Check request body format
- Verify required fields are included
- Check data types match schema

### Server Not Responding
- Verify server is running
- Check `base_url` in environment
- Test with Health Check endpoint

## 📚 Additional Resources

- See `VONAGE_COMPLETE_SETUP.md` for Vonage setup
- See `TRAINING_DATA_GUIDE.md` for training data examples
- See `API_EXAMPLES.md` for more API examples

---

**Happy Testing! 🎉**

