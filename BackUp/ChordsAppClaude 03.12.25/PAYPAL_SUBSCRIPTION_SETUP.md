# PayPal Subscription Setup Guide for ChordsApp

This guide will help you set up PayPal subscriptions for ChordsApp.

## Prerequisites

1. PayPal Business Account
2. Access to PayPal Developer Dashboard
3. Node.js server for webhook handling

## Step 1: Create PayPal Subscription Plans

1. **Log in to PayPal Developer Dashboard**
   - Go to https://developer.paypal.com/
   - Click "Dashboard" in the top right

2. **Create Subscription Plans**

   ### Basic Plan ($0.99/month)
   - Navigate to "Catalog" → "Products" → "Create Product"
   - Product Details:
     - Type: `Service`
     - Name: `ChordsApp Basic`
     - Description: `20 AI analyses/month + Save to Library`
   - Click "Save"
   - Click "Add Pricing" → "Create Plan"
   - Plan Details:
     - Name: `ChordsApp Basic Monthly`
     - Billing cycle: `Monthly`
     - Price: `$0.99 USD`
     - Setup fee: `$0.00`
     - Trial period: `3 days` (free)
   - Save the **Plan ID** (starts with `P-`)

   ### Pro Plan ($2.99/month)
   - Navigate to "Catalog" → "Products" → "Create Product"
   - Product Details:
     - Type: `Service`
     - Name: `ChordsApp Pro`
     - Description: `Unlimited AI analyses + Nashville Numbers + Save to Library`
   - Click "Save"
   - Click "Add Pricing" → "Create Plan"
   - Plan Details:
     - Name: `ChordsApp Pro Monthly`
     - Billing cycle: `Monthly`
     - Price: `$2.99 USD`
     - Setup fee: `$0.00`
     - Trial period: `3 days` (free)
   - Save the **Plan ID** (starts with `P-`)

## Step 2: Get Your Client ID

1. In PayPal Developer Dashboard, go to "Apps & Credentials"
2. Under "REST API apps", create a new app or use existing
3. Copy your **Client ID** (for Live or Sandbox)

## Step 3: Update ChordsApp Code

### Update `paypal-subscription.js`

Replace the following values in `paypal-subscription.js`:

```javascript
// Line 6-9: Replace with your actual Plan IDs
const PAYPAL_PLAN_IDS = {
    BASIC: 'P-YOUR-BASIC-PLAN-ID-HERE',  // Replace with actual Basic plan ID
    PRO: 'P-YOUR-PRO-PLAN-ID-HERE'       // Replace with actual Pro plan ID
};
```

```javascript
// Line 25: Replace with your actual Client ID
script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_ACTUAL_CLIENT_ID&vault=true&intent=subscription';
```

**Note:** Use **Sandbox Client ID** for testing, and **Live Client ID** for production.

## Step 4: Set Up Webhooks (Required for Subscription Management)

PayPal webhooks notify your server when subscription events occur (payment success, cancellation, etc.).

### Create Webhook Endpoint

You need a server endpoint to receive PayPal webhooks. Here's a basic example using Node.js + Express:

```javascript
// server.js or webhook-handler.js
const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

// PayPal Webhook endpoint
app.post('/api/paypal-webhook', async (req, res) => {
    const event = req.body;

    console.log('PayPal Webhook Event:', event.event_type);

    try {
        // Verify webhook signature (IMPORTANT for security)
        // See: https://developer.paypal.com/api/rest/webhooks/

        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                // Subscription activated (after trial or payment)
                const userId = event.resource.custom_id;
                const subscriptionId = event.resource.id;
                const planId = event.resource.plan_id;

                // Determine tier from plan ID
                let tier = 'FREE';
                if (planId.includes('BASIC')) tier = 'BASIC';
                if (planId.includes('PRO')) tier = 'PRO';

                // Update Firebase
                await admin.database().ref(`users/${userId}/subscription`).set({
                    tier: tier,
                    status: 'active',
                    paypalSubscriptionId: subscriptionId,
                    startDate: new Date().toISOString(),
                    endDate: null
                });

                console.log(`Subscription activated for user ${userId}: ${tier}`);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                // Subscription cancelled
                const cancelUserId = event.resource.custom_id;

                await admin.database().ref(`users/${cancelUserId}/subscription`).update({
                    status: 'canceled',
                    endDate: new Date().toISOString()
                });

                console.log(`Subscription cancelled for user ${cancelUserId}`);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                // Payment failed - suspend subscription
                const suspendUserId = event.resource.custom_id;

                await admin.database().ref(`users/${suspendUserId}/subscription`).update({
                    status: 'suspended'
                });

                console.log(`Subscription suspended for user ${suspendUserId}`);
                break;

            case 'PAYMENT.SALE.COMPLETED':
                // Recurring payment successful
                console.log('Payment completed:', event.resource.id);
                break;

            default:
                console.log('Unhandled event type:', event.event_type);
        }

        res.status(200).send('Webhook processed');

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Webhook processing failed');
    }
});

app.listen(3000, () => {
    console.log('Webhook handler listening on port 3000');
});
```

### Register Webhook in PayPal

1. Go to PayPal Developer Dashboard → "Webhooks"
2. Click "Add Webhook"
3. Webhook URL: `https://your-domain.com/api/paypal-webhook`
4. Event types to subscribe:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.UPDATED`
   - `PAYMENT.SALE.COMPLETED`
5. Save and note the **Webhook ID**

## Step 5: Testing

### Use PayPal Sandbox for Testing

1. Create test accounts in PayPal Developer Dashboard
2. Use Sandbox Client ID in your code
3. Test subscription flow with test accounts
4. Verify Firebase data is updated correctly
5. Check webhook events in PayPal Dashboard

### Test Checklist

- [ ] Basic subscription flow works
- [ ] Pro subscription flow works
- [ ] 3-day trial activates correctly
- [ ] Firebase subscription data updates
- [ ] Usage limits are enforced
- [ ] Save/Load features are gated properly
- [ ] Nashville Numbers gated for Pro only
- [ ] Webhooks trigger on subscription events

## Step 6: Go Live

1. **Switch to Live Mode**
   - Use Live Client ID instead of Sandbox
   - Use Live Plan IDs
   - Update webhook URL to production domain

2. **Update Code**
   ```javascript
   // paypal-subscription.js - Line 25
   script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_LIVE_CLIENT_ID&vault=true&intent=subscription';
   ```

3. **Deploy**
   - Push code to production
   - Verify webhook endpoint is accessible
   - Test with real PayPal account

## Important Security Notes

1. **Never expose Plan IDs or Client ID in client code for sensitive operations**
   - Plan IDs and Client ID in browser are okay for subscription buttons
   - Verify all subscription status on server-side

2. **Always verify webhook signatures**
   - Use PayPal SDK to verify webhook authenticity
   - Reject unverified webhooks

3. **Store sensitive data server-side**
   - Don't store payment details in Firebase
   - Only store subscription status and tier

4. **Use Firebase Security Rules**
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           "subscription": {
             ".read": "$uid === auth.uid",
             ".write": false  // Only server can write
           },
           "usage": {
             ".read": "$uid === auth.uid",
             ".write": "$uid === auth.uid"  // User can update their own usage
           }
         }
       }
     }
   }
   ```

## Troubleshooting

### Subscriptions not activating
- Check webhook is receiving events
- Verify custom_id is set correctly (user UID)
- Check Firebase security rules

### PayPal buttons not showing
- Verify Client ID is correct
- Check browser console for errors
- Ensure PayPal SDK is loaded

### Trial not working
- Verify trial period is set in PayPal plan settings
- Check plan configuration in PayPal Dashboard

## Support Resources

- [PayPal Subscriptions API Documentation](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)
- [PayPal JavaScript SDK Reference](https://developer.paypal.com/sdk/js/reference/)

## Next Steps

1. Set up PayPal Business Account
2. Create subscription plans
3. Update code with Plan IDs and Client ID
4. Set up webhook handler
5. Test in Sandbox mode
6. Go live!

---

**Need Help?** Check PayPal Developer Forums or contact PayPal Merchant Support.
