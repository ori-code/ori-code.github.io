# ChordsApp Admin Guide
## Server-Side Usage Tracking & Bonus Analyses

This guide explains how to manage user analysis limits and give away free bonus analyses securely.

---

## 🔐 Security Overview

**Server-Side Only:** Analysis counts are now controlled exclusively by the server. Users **cannot** tamper with their usage limits by editing Firebase directly.

### Firebase Security Rules

Apply these rules in Firebase Console to prevent client-side tampering:

```json
{
  "rules": {
    "users": {
      "$uid": {
        "subscription": {
          ".read": "$uid === auth.uid",
          ".write": false
        },
        "usage": {
          ".read": "$uid === auth.uid",
          ".write": false
        },
        "bonusAnalyses": {
          ".read": "$uid === auth.uid",
          ".write": false
        },
        "songs": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}
```

**Important:** Only the server (using Firebase Admin SDK) can write to `subscription`, `usage`, and `bonusAnalyses`.

---

## 🎁 Giving Bonus Analyses

You can give users bonus analyses as promotions, rewards, or customer support.

### Setup Admin Key

1. Generate a secure admin key:
   ```bash
   openssl rand -hex 32
   ```

2. Add to `.env`:
   ```env
   ADMIN_KEY=your-generated-secure-key-here
   ```

3. Restart your server

### Give Bonus Analyses via API

**Endpoint:** `POST /api/admin/give-bonus-analyses`

**Example using curl:**

```bash
curl -X POST http://localhost:3002/api/admin/give-bonus-analyses \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "firebase-user-id-here",
    "count": 10,
    "adminKey": "your-admin-key-here"
  }'
```

**Response:**
```json
{
  "success": true,
  "userId": "abc123...",
  "bonusAdded": 10,
  "totalBonus": 10
}
```

### Give Bonus via Postman/Insomnia

1. Method: `POST`
2. URL: `http://localhost:3002/api/admin/give-bonus-analyses`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "userId": "USER_FIREBASE_UID",
     "count": 5,
     "adminKey": "YOUR_ADMIN_KEY"
   }
   ```

### How Bonus Analyses Work

- **Priority:** Bonus analyses are used **before** monthly limit
- **Example:** Free user (3/month) gets 5 bonus = 8 total analyses
- **Usage Order:**
  1. Use bonus first (5 analyses)
  2. Then use monthly limit (3 analyses)
- **No Expiration:** Bonus analyses don't expire

---

## 📊 Check User Stats

Get detailed usage information for any user.

**Endpoint:** `GET /api/admin/user-stats/:userId?adminKey=xxx`

**Example:**

```bash
curl "http://localhost:3002/api/admin/user-stats/firebase-user-id?adminKey=your-admin-key"
```

**Response:**
```json
{
  "userId": "abc123...",
  "subscription": {
    "tier": "FREE",
    "status": "active"
  },
  "usage": {
    "analysesThisMonth": 2,
    "monthStartDate": "2025-01-01T00:00:00.000Z"
  },
  "bonusAnalyses": 5
}
```

---

## 🔍 How Usage Tracking Works

### 1. User Tries to Analyze

**Client → Server:** `GET /api/can-analyze`
- Client sends Firebase ID token in `Authorization` header
- Server verifies token and checks user's tier and usage
- Returns: `{ canAnalyze: true/false, remaining: X }`

### 2. Analysis Allowed

If user can analyze, client proceeds with AI analysis.

### 3. Analysis Complete

**Client → Server:** `POST /api/increment-analysis`
- Server increments usage counter
- **Uses bonus first** if available
- Otherwise increments monthly count

### 4. Monthly Reset

- Server automatically resets usage when month changes
- Checks happen on every `/api/can-analyze` call
- Bonus analyses are preserved

---

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd ChordsApp
npm install
```

This installs `firebase-admin` and other dependencies.

### 2. Set Up Firebase Admin SDK

**Option A: Development (Application Default Credentials)**

Run with your Firebase account:
```bash
firebase login
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
node server.js
```

**Option B: Production (Environment Variable)**

1. Download service account key from Firebase Console:
   - Settings → Service Accounts → Generate New Private Key

2. Add to `.env` as JSON string:
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
   ```

### 3. Apply Firebase Security Rules

1. Go to Firebase Console → Realtime Database → Rules
2. Copy rules from `FIREBASE_RULES.json`
3. Publish rules

### 4. Set Admin Key

```bash
# Generate secure key
openssl rand -hex 32

# Add to .env
echo "ADMIN_KEY=generated-key-here" >> .env
```

### 5. Start Server

```bash
npm start
```

---

## 📝 Admin Tasks Cheat Sheet

### Give 10 Bonus Analyses to User

```bash
curl -X POST http://localhost:3002/api/admin/give-bonus-analyses \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","count":10,"adminKey":"ADMIN_KEY"}'
```

### Check User's Usage

```bash
curl "http://localhost:3002/api/admin/user-stats/USER_ID?adminKey=ADMIN_KEY"
```

### Get User ID from Firebase Console

1. Firebase Console → Authentication
2. Find user by email
3. Copy "User UID"

---

## 🚨 Troubleshooting

### "Firebase Admin not initialized"

**Problem:** Server can't connect to Firebase.

**Solution:**
- Check `FIREBASE_SERVICE_ACCOUNT` in `.env`
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or use `firebase login` for local development

### "Forbidden - Invalid admin key"

**Problem:** Wrong `ADMIN_KEY` provided.

**Solution:**
- Check `.env` file for correct `ADMIN_KEY`
- Make sure you're sending the same key in API request
- Restart server after changing `.env`

### "Unauthorized - Invalid token"

**Problem:** Client's Firebase token is invalid/expired.

**Solution:**
- User needs to sign in again
- Check Firebase Authentication is working
- Token expires after 1 hour (Firebase auto-refreshes)

### User Can Still Modify Firebase Directly

**Problem:** Firebase Rules not applied.

**Solution:**
1. Copy rules from `FIREBASE_RULES.json`
2. Firebase Console → Realtime Database → Rules
3. Paste and Publish
4. Test in Rules Playground

---

## 💡 Use Cases

### Promotional Campaigns

Give everyone who signs up in January 50 bonus analyses:

```bash
# Script to give bonus to multiple users
for userId in user1 user2 user3; do
  curl -X POST http://localhost:3002/api/admin/give-bonus-analyses \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$userId\",\"count\":50,\"adminKey\":\"$ADMIN_KEY\"}"
done
```

### Customer Support

User reports a problem with analysis? Give them bonus analyses:

```bash
curl -X POST http://localhost:3002/api/admin/give-bonus-analyses \
  -H "Content-Type: application/json" \
  -d '{"userId":"unhappy-user-id","count":5,"adminKey":"YOUR_KEY"}'
```

### Beta Testers

Reward beta testers with unlimited analyses for a month:

```bash
# Give 1000 bonus analyses (effectively unlimited)
curl -X POST http://localhost:3002/api/admin/give-bonus-analyses \
  -H "Content-Type: application/json" \
  -d '{"userId":"beta-tester-id","count":1000,"adminKey":"YOUR_KEY"}'
```

---

## 🔒 Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Rotate admin key regularly** - Generate new key every 3-6 months
3. **Use HTTPS in production** - Never send admin key over HTTP
4. **Limit admin key access** - Only share with trusted admins
5. **Monitor admin endpoint usage** - Check server logs for unauthorized attempts
6. **Apply Firebase Rules** - Essential to prevent client tampering

---

## 📈 Monitoring

### View Server Logs

```bash
# Local development
tail -f logs/server.log

# Or check console output
npm start
```

### Firebase Console

1. Realtime Database → Data tab
2. Navigate to `users/{userId}/usage`
3. See real-time usage counts

### Check All Users' Usage

Query Firebase directly (requires admin access):

```javascript
// In Firebase Console → Database → Query
admin.database().ref('users').once('value', (snapshot) => {
  snapshot.forEach((userSnap) => {
    const usage = userSnap.child('usage').val();
    console.log(userSnap.key, usage);
  });
});
```

---

## 🎓 Summary

**What Changed:**
- ✅ Usage tracking moved to server-side
- ✅ Firebase writes require admin authentication
- ✅ Users cannot tamper with their limits
- ✅ Admins can give bonus analyses securely

**How to Give Bonus:**
1. Get user's Firebase UID
2. POST to `/api/admin/give-bonus-analyses`
3. Include `userId`, `count`, and `adminKey`

**Security:**
- All writes go through server
- Firebase Rules block client writes
- Admin key required for bonus operations

---

Need help? Check server logs or Firebase Console for errors.
