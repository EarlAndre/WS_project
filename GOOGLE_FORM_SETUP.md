# Google Form Webhook Setup Instructions

## Step 1: Get Your Backend Webhook URL

Your backend webhook is available at:
```
http://127.0.0.1:8000/api/google-form-submit/
```

When deployed, replace with your actual backend URL (e.g., https://your-domain.com/api/google-form-submit/)

---

## Step 2: Set the Secret Token

Add to your `.env` file in the `backend/` directory:
```
GOOGLE_FORM_SECRET='my-secure-webhook-secret-123456'
```

Choose a strong random token (at least 20 characters). This keeps the webhook secure.

---

## Step 3: Add Google Apps Script to Your Form

1. Open your Google Form: https://docs.google.com/forms/d/e/1FAIpQLSeAa-p2RtaTYmuohv1r1uKfYO8bGMlk7NIcPnqYiAi6l9GD-w/viewform

2. Click the **3-dot menu** (⋮) at the top right → **Script editor**

3. Delete any existing code and paste this:

```javascript
// Configuration - CHANGE THESE VALUES
const WEBHOOK_URL = 'http://127.0.0.1:8000/api/google-form-submit/'; // Update to your backend URL
const SECRET_TOKEN = 'my-secure-webhook-secret-123456'; // Must match GOOGLE_FORM_SECRET in .env
const SEMINAR_ID = 1; // Set this to the seminar ID for this form

// Field mapping - ADJUST FIELD NUMBERS IF YOUR FORM FIELDS ARE DIFFERENT
const FIELD_NAME = 0; // First field (Name)
const FIELD_EMAIL = 1; // Second field (Email)
const FIELD_YEAR_SECTION = 2; // Third field (Year And Section)

function onFormSubmit(e) {
  try {
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract form answers by field index
    const name = itemResponses[FIELD_NAME]?.getResponse() || '';
    const email = itemResponses[FIELD_EMAIL]?.getResponse() || '';
    const yearSection = itemResponses[FIELD_YEAR_SECTION]?.getResponse() || '';
    
    // Log for debugging
    console.log('Form submitted:', { name, email, yearSection, seminarId: SEMINAR_ID });
    
    // Prepare webhook payload
    const payload = {
      secret_token: SECRET_TOKEN,
      seminar_id: SEMINAR_ID,
      name: name,
      email: email,
      year_section: yearSection
    };
    
    // Send to backend webhook
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Don't throw on non-200 responses
    };
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Webhook response:', responseCode, responseText);
    
    if (responseCode !== 201 && responseCode !== 200) {
      console.error('Webhook failed:', responseCode, responseText);
    }
  } catch (error) {
    console.error('Error in onFormSubmit:', error);
  }
}

// Test function - run this to verify setup
function testWebhook() {
  const testPayload = {
    secret_token: SECRET_TOKEN,
    seminar_id: SEMINAR_ID,
    name: 'Test User',
    email: 'test@example.com',
    year_section: 'Test Section'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(testPayload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  console.log('Test response:', response.getResponseCode(), response.getContentText());
}
```

---

## Step 4: Customize the Script

Update these values in the script:

```javascript
// Configuration - CHANGE THESE VALUES
const WEBHOOK_URL = 'http://127.0.0.1:8000/api/google-form-submit/'; // Your backend URL
const SECRET_TOKEN = 'my-secure-webhook-secret-123456'; // Must match .env GOOGLE_FORM_SECRET
const SEMINAR_ID = 1; // The seminar ID this form belongs to
```

**How to find field numbers:**
- Open your form in edit mode
- Your form has:
  - Field 0: Name
  - Field 1: Email  
  - Field 2: Year And Section

If your fields are in different order, adjust FIELD_NAME, FIELD_EMAIL, FIELD_YEAR_SECTION accordingly.

---

## Step 5: Create an Installable Trigger

1. In the script editor, click **Triggers** (⏰) on the left sidebar
2. Click **Create new trigger**
3. Set:
   - Function: `onFormSubmit`
   - Deployment: `Head`
   - Event type: `On form submit`
   - Notification level: `Notify me never` (or your preference)
4. Click **Save**

Google will ask for permission - grant it.

---

## Step 6: Test the Setup

1. In the script editor, click **Run** to execute `testWebhook()`
2. View **Logs** (Ctrl+Enter) to see results
3. Check your backend `/api/attendance/` to see if a test entry was created

---

## Step 7: Test End-to-End

1. Scan a QR code on your phone
2. Google Form opens
3. Fill it out completely
4. Click **Submit**
5. Wait 5-10 seconds
6. Check your backend `/api/joined-participants/` or `/api/attendance/` to see the new entry

---

## Troubleshooting

**Webhook not calling?**
- Check script editor **Logs** (Ctrl+Enter) for errors
- Verify WEBHOOK_URL is correct and backend is running
- Check SECRET_TOKEN matches .env exactly
- Verify trigger is created and enabled

**Wrong field values?**
- Adjust FIELD_NAME, FIELD_EMAIL, FIELD_YEAR_SECTION numbers
- Run `testWebhook()` again

**Backend not receiving data?**
- Check Django logs: `python manage.py runserver`
- Verify `.env` has `GOOGLE_FORM_SECRET` set
- Try accessing `/api/google-form-submit/` directly (will fail auth but should not crash)

---

## When Deployed

Before deploying to production:
1. Update WEBHOOK_URL in Apps Script to your production backend URL
2. Set a strong random SECRET_TOKEN (40+ characters)
3. Update `.env` on your production server with the same SECRET_TOKEN
4. Re-run the Apps Script trigger to ensure it's using production URL

