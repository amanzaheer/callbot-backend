# Multi-Language Support Guide

**Complete guide for training and using your bot in multiple languages (Urdu & English)**

## ✅ Current Status

Your bot **CAN handle multiple languages** with the updates we just made! Here's what was added:

### ✅ What Works Now:

1. **Automatic Language Detection** - Bot detects language from user input
2. **Multi-Language Training Data** - Upload training data in different languages
3. **Per-Call Language Tracking** - Each call remembers the detected language
4. **Language-Specific Responses** - Bot responds in the same language as user
5. **Supported Languages** - Configure which languages your business supports

### ✅ Supported Languages:

- **English (en)** - Default
- **Urdu (ur)** - Full support with Urdu script
- **Arabic (ar)**
- **Spanish (es)**
- **French (fr)**
- **German (de)**
- **Hindi (hi)**
- **Chinese (zh)**

---

## 🚀 Quick Start

### Step 1: Configure Supported Languages

Update your business profile to support multiple languages:

```bash
PUT /api/businesses/profile
{
  "aiSettings": {
    "supportedLanguages": ["en", "ur"],
    "language": "en"
  }
}
```

**Example:**
- `supportedLanguages: ["en", "ur"]` - Bot supports English and Urdu
- `language: "en"` - Default language is English

### Step 2: Upload Training Data in Multiple Languages

Upload training data with language tags:

```bash
POST /api/businesses/training-data
{
  "trainingData": [
    {
      "type": "qa",
      "question": "What are your hours?",
      "answer": "We're open 9 AM to 6 PM Monday to Friday.",
      "language": "en",
      "category": "hours"
    },
    {
      "type": "qa",
      "question": "آپ کے اوقات کیا ہیں؟",
      "answer": "ہم پیر سے جمعہ صبح 9 بجے سے شام 6 بجے تک کھلے رہتے ہیں۔",
      "language": "ur",
      "category": "hours"
    },
    {
      "type": "conversation",
      "conversation": {
        "user": "I want to book a table",
        "assistant": "I'd be happy to help you book a table. For how many people?"
      },
      "language": "en",
      "category": "booking"
    },
    {
      "type": "conversation",
      "conversation": {
        "user": "میں ایک میز بک کروانا چاہتا ہوں",
        "assistant": "میں آپ کی میز بک کرنے میں مدد کرنے میں خوش ہوں گا۔ کتنے لوگوں کے لیے؟"
      },
      "language": "ur",
      "category": "booking"
    }
  ]
}
```

### Step 3: Test Multi-Language

1. **Make a call** (outbound or inbound)
2. **Speak in Urdu** - Bot will detect and respond in Urdu
3. **Speak in English** - Bot will detect and respond in English
4. **Switch languages** - Bot adapts automatically!

---

## 📝 Training Data Examples

### English Training Data

```json
{
  "type": "qa",
  "question": "What services do you offer?",
  "answer": "We offer consultation, treatment, and follow-up services.",
  "language": "en",
  "category": "services"
}
```

### Urdu Training Data

```json
{
  "type": "qa",
  "question": "آپ کیا خدمات پیش کرتے ہیں؟",
  "answer": "ہم مشاورت، علاج، اور فالو اپ خدمات پیش کرتے ہیں۔",
  "language": "ur",
  "category": "services"
}
```

### Mixed Language Conversation

```json
{
  "type": "conversation",
  "conversation": {
    "user": "میں ایک appointment چاہتا ہوں",
    "assistant": "میں آپ کی appointment بک کرنے میں مدد کر سکتا ہوں۔ کون سا دن آپ کے لیے مناسب ہے؟"
  },
  "language": "ur",
  "category": "appointments"
}
```

---

## 🔧 How It Works

### 1. Language Detection

When user speaks, the bot:
- Analyzes the input text
- Detects language (Urdu, English, etc.)
- Stores detected language in call session
- Uses that language for all responses

**Detection Methods:**
- **Urdu**: Detects Urdu script (ا-ی) and common Urdu words
- **English**: Detects English characters and words
- **Fallback**: Defaults to English if uncertain

### 2. Language-Specific Training Data

The bot automatically:
- Filters training data by detected language
- Uses Urdu training data when user speaks Urdu
- Uses English training data when user speaks English
- Falls back to English if no language-specific data found

### 3. Language-Specific Responses

The bot:
- Responds in the same language as user
- Uses appropriate voice for language
- Uses correct language code for speech recognition

---

## 📊 Language Codes

### Supported Language Codes:

| Language | Code | Vonage Code | Voice (Vonage) |
|----------|------|-------------|----------------|
| English | `en` | `en-US` | Amy |
| Urdu | `ur` | `ur-PK` | Amy |
| Arabic | `ar` | `ar-SA` | Laila |
| Spanish | `es` | `es-ES` | Enrique |
| French | `fr` | `fr-FR` | Mathieu |
| German | `de` | `de-DE` | Hans |
| Hindi | `hi` | `hi-IN` | Aditi |
| Chinese | `zh` | `zh-CN` | Zhiyu |

---

## 🎯 Best Practices

### 1. Upload Training Data in Both Languages

Always upload training data in all languages you support:

```json
{
  "trainingData": [
    // English version
    {
      "type": "qa",
      "question": "What are your hours?",
      "answer": "We're open 9 AM to 6 PM.",
      "language": "en"
    },
    // Urdu version
    {
      "type": "qa",
      "question": "آپ کے اوقات کیا ہیں؟",
      "answer": "ہم صبح 9 بجے سے شام 6 بجے تک کھلے رہتے ہیں۔",
      "language": "ur"
    }
  ]
}
```

### 2. Use Consistent Categories

Use the same `category` for both languages so they're grouped together:

```json
{
  "language": "en",
  "category": "hours"
}
```

```json
{
  "language": "ur",
  "category": "hours"
}
```

### 3. Test Both Languages

Test your bot in both languages:
- Make a call and speak in English
- Make another call and speak in Urdu
- Verify bot responds correctly in each language

### 4. Set Default Language

Always set a default language in business profile:

```json
{
  "aiSettings": {
    "language": "en",
    "supportedLanguages": ["en", "ur"]
  }
}
```

---

## 🔍 Troubleshooting

### Bot Not Detecting Urdu

**Solution:**
- Make sure you uploaded Urdu training data with `"language": "ur"`
- Check that `supportedLanguages` includes `"ur"`
- Verify user input contains Urdu script or words

### Bot Responding in Wrong Language

**Solution:**
- Check detected language in call session
- Verify training data has correct language tag
- Make sure `supportedLanguages` includes the language

### Training Data Not Working

**Solution:**
- Verify `language` field is set correctly (`"en"` or `"ur"`)
- Check training data is active (`isActive: true`)
- Ensure training data has good examples

---

## 📝 Complete Example: Restaurant with Urdu & English

```json
{
  "trainingData": [
    // English Q&A
    {
      "type": "qa",
      "question": "What's on your menu?",
      "answer": "We offer Italian dishes including pasta, pizza, and salads.",
      "language": "en",
      "category": "menu"
    },
    // Urdu Q&A
    {
      "type": "qa",
      "question": "آپ کے مینو میں کیا ہے؟",
      "answer": "ہم اطالوی کھانے پیش کرتے ہیں جن میں پاستا، پیزا، اور سلاد شامل ہیں۔",
      "language": "ur",
      "category": "menu"
    },
    // English Conversation
    {
      "type": "conversation",
      "conversation": {
        "user": "I want to make a reservation",
        "assistant": "I'd be happy to help! For how many people and what date?"
      },
      "language": "en",
      "category": "reservations"
    },
    // Urdu Conversation
    {
      "type": "conversation",
      "conversation": {
        "user": "میں ایک ریزرویشن بنانا چاہتا ہوں",
        "assistant": "میں خوشی سے مدد کروں گا! کتنے لوگوں کے لیے اور کون سا دن؟"
      },
      "language": "ur",
      "category": "reservations"
    }
  ]
}
```

---

## ✅ Checklist

Before using multi-language:

- [ ] Update business profile with `supportedLanguages: ["en", "ur"]`
- [ ] Upload training data in English (`"language": "en"`)
- [ ] Upload training data in Urdu (`"language": "ur"`)
- [ ] Test call in English
- [ ] Test call in Urdu
- [ ] Verify bot responds in correct language
- [ ] Check call session shows correct `detectedLanguage`

---

## 🎉 Success!

Your bot now supports:
- ✅ **Automatic language detection**
- ✅ **Multi-language training data**
- ✅ **Language-specific responses**
- ✅ **Urdu & English support**
- ✅ **Easy to add more languages**

**Next Steps:**
1. Upload training data in both languages
2. Test with real calls
3. Monitor and improve based on conversations

---

**Happy Multi-Language Calling! 🎉**

