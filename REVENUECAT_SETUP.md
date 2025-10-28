# RevenueCat Integration Setup Guide

This guide will help you set up RevenueCat for iOS subscription management in your wellness platform.

## 🚀 **Overview**

RevenueCat integration provides:
- **iOS Subscription Management**: Handle App Store subscriptions seamlessly
- **Cross-Platform Support**: Works alongside existing Stripe web subscriptions
- **Unified Experience**: Single subscription system for all platforms
- **Webhook Integration**: Automatic subscription status updates

## 📋 **Prerequisites**

1. **RevenueCat Account**: Sign up at [revenuecat.com](https://revenuecat.com)
2. **Apple Developer Account**: For App Store Connect integration
3. **Supabase Project**: Your existing project with database access

## 🔧 **Setup Steps**

### **1. RevenueCat Dashboard Setup**

1. **Create RevenueCat Project**:
   - Go to RevenueCat dashboard
   - Create a new project for your app
   - Note your API key

2. **Configure Products**:
   - Add products: `premium_monthly`, `premium_yearly`
   - Set up entitlements: `premium`
   - Configure pricing in App Store Connect

3. **Set Up Webhooks**:
   - Webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
   - Enable all subscription events

### **2. Database Migration**

Run the migration to add RevenueCat support:

```bash
# Apply the migration
supabase db reset
# or
supabase migration up
```

This creates:
- `revenuecat_products` table
- `revenuecat_entitlements` table  
- `revenuecat_subscriptions` table
- RevenueCat fields in existing tables

### **3. Environment Variables**

Add to your `.env` file:

```env
# RevenueCat Configuration (SDK API Key - safe for client-side)
REVENUECAT_SDK_API_KEY=your_sdk_api_key
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret

# Supabase Configuration (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: Use the **SDK API Key** from RevenueCat dashboard, not the Secret API Key. The SDK key is safe to use in mobile apps.

### **4. iOS App Integration**

#### **Install RevenueCat SDK**

```bash
# Using CocoaPods
pod 'RevenueCat'

# Or using Swift Package Manager
# Add: https://github.com/RevenueCat/purchases-ios
```

#### **Initialize RevenueCat**

```swift
import RevenueCat

// In AppDelegate.swift or App.swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    // Configure RevenueCat with SDK API Key
    Purchases.configure(withAPIKey: "appl_zcKAMYKXLFpqsKWPdnNDUzJOOtP")
    
    // Set user ID when user logs in
    if let userId = getCurrentUserId() {
        Purchases.logIn(userId) { (customerInfo, created, error) in
            // Handle login
        }
    }
    
    return true
}
```

#### **Purchase Implementation**

```swift
// Purchase a product
func purchaseProduct(productId: String) {
    Purchases.shared.getProducts(["premium_monthly", "premium_yearly"]) { products in
        if let product = products.first(where: { $0.productIdentifier == productId }) {
            Purchases.shared.purchase(product: product) { (transaction, customerInfo, error, userCancelled) in
                if let error = error {
                    // Handle error
                    return
                }
                
                if customerInfo?.entitlements["premium"]?.isActive == true {
                    // User has premium access
                    self.updateSubscriptionStatus()
                }
            }
        }
    }
}

// Restore purchases
func restorePurchases() {
    Purchases.shared.restorePurchases { (customerInfo, error) in
        if let error = error {
            // Handle error
            return
        }
        
        if customerInfo?.entitlements["premium"]?.isActive == true {
            // User has premium access
            self.updateSubscriptionStatus()
        }
    }
}
```

### **5. Webhook Configuration**

The webhook handler is already created at:
`supabase/functions/revenuecat-webhook/index.ts`

**Configure in RevenueCat Dashboard**:
1. Go to Project Settings → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
3. Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`
4. Set authentication: Bearer token with your webhook secret

### **6. Frontend Integration**

The frontend components are already set up:

#### **Subscription Button**
```tsx
import { SubscriptionButton } from './components/Subscription/SubscriptionButton';

// Automatically detects platform and shows appropriate modal
<SubscriptionButton className="w-full" />
```

#### **Subscription Hook**
```tsx
import { useSubscription } from './hooks/useSubscription';

function MyComponent() {
  const { hasPremium, isProfessional, features, hasFeature } = useSubscription();
  
  if (hasFeature('create_listings')) {
    // Show premium feature
  }
}
```

## 🎯 **Usage Examples**

### **Check Premium Access**
```typescript
import { hasPremiumAccess } from './lib/subscription';

const hasPremium = await hasPremiumAccess(userId);
```

### **Check Specific Features**
```typescript
import { hasFeatureAccess } from './lib/subscription';

const canCreateListings = await hasFeatureAccess(userId, 'create_listings');
```

### **Get Subscription Info**
```typescript
import { getUnifiedSubscription } from './lib/subscription';

const subscription = await getUnifiedSubscription(userId);
console.log(subscription.source); // 'stripe' | 'revenuecat' | 'none'
console.log(subscription.platform); // 'web' | 'ios' | 'android'
```

## 🔄 **Subscription Flow**

### **iOS Users**:
1. User taps "Upgrade to Premium"
2. RevenueCat modal opens with App Store products
3. User purchases through App Store
4. RevenueCat webhook updates database
5. User gets premium access immediately

### **Web Users**:
1. User taps "Upgrade to Premium"  
2. Stripe modal opens with web products
3. User pays with card/PayPal
4. Stripe webhook updates database
5. User gets premium access immediately

## 🛠 **Testing**

### **Sandbox Testing**
1. Use RevenueCat sandbox environment
2. Create test users in App Store Connect
3. Test purchases with sandbox accounts
4. Verify webhook events in RevenueCat dashboard

### **Production Testing**
1. Use TestFlight for iOS testing
2. Test with real App Store accounts
3. Monitor webhook logs in Supabase
4. Verify subscription status updates

## 📊 **Monitoring**

### **RevenueCat Dashboard**
- Monitor subscription metrics
- Track conversion rates
- View customer lifetime value
- Analyze churn rates

### **Supabase Logs**
- Check webhook function logs
- Monitor database updates
- Track subscription events

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Webhook Not Receiving Events**:
   - Check webhook URL in RevenueCat dashboard
   - Verify Supabase function is deployed
   - Check authentication headers

2. **Subscription Not Updating**:
   - Check webhook logs in Supabase
   - Verify database permissions
   - Check RevenueCat event logs

3. **iOS Purchase Failing**:
   - Verify App Store Connect configuration
   - Check product IDs match
   - Test with sandbox accounts

### **Debug Commands**

```bash
# Check Supabase function logs
supabase functions logs revenuecat-webhook

# Test webhook locally
supabase functions serve revenuecat-webhook

# Check database
supabase db reset
```

## 🚀 **Deployment**

### **Supabase Functions**
```bash
# Deploy webhook function
supabase functions deploy revenuecat-webhook
```

### **Environment Variables**
Make sure all environment variables are set in your production environment.

## 📈 **Analytics**

The system tracks:
- Subscription source (Stripe vs RevenueCat)
- Platform usage (iOS vs Web)
- Feature usage by subscription type
- Conversion rates by platform

## 🔐 **Security**

- Webhook authentication with Bearer tokens
- Row Level Security (RLS) on all tables
- Secure API key management
- User data encryption

## 📚 **Additional Resources**

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [iOS SDK Guide](https://docs.revenuecat.com/docs/ios)
- [Webhook Events](https://docs.revenuecat.com/docs/webhooks)
- [Supabase Functions](https://supabase.com/docs/guides/functions)

---

## ✅ **Checklist**

- [ ] RevenueCat account created
- [ ] Products configured in App Store Connect
- [ ] Database migration applied
- [ ] Environment variables set
- [ ] iOS SDK integrated
- [ ] Webhook configured
- [ ] Frontend components updated
- [ ] Testing completed
- [ ] Production deployment ready

Your RevenueCat integration is now ready! 🎉
