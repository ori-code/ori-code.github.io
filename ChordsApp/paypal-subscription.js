/**
 * PayPal Subscription Integration for aChordim
 * Handles PayPal subscription buttons and payment processing
 */

// Environment Detection
const PAYPAL_ENV = (() => {
    const hostname = window.location.hostname;
    const isLocalDev = hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       hostname.startsWith('172.');
    return isLocalDev ? 'sandbox' : 'production';
})();

console.log(`PayPal Environment: ${PAYPAL_ENV}`);

// PayPal Client IDs
// NOTE: Using production client ID for both environments since plans were created in live account with test prices
const PAYPAL_CLIENT_IDS = {
    sandbox: 'AZObqKE5ztYeUcv5jiLNxiM7XgV6OZ7HdEzd6xfEB7_feWVC6z4HrsPdYvtvWcJYi3lAs6xgSRxAXwW8',  // Using production for testing
    production: 'AZObqKE5ztYeUcv5jiLNxiM7XgV6OZ7HdEzd6xfEB7_feWVC6z4HrsPdYvtvWcJYi3lAs6xgSRxAXwW8'
};

// PayPal Plan IDs (from PayPal Developer Dashboard)
const PAYPAL_PLAN_IDS = {
    sandbox: {
        BASIC: 'P-8J890296A3354335HNFP76AY',  // Sandbox Basic plan
        PRO: 'P-0LC262226Y1697300NFP77MY'     // Sandbox Pro plan
    },
    production: {
        BASIC: 'P-8J890296A3354335HNFP76AY',  // Production Basic plan $0.99/month
        PRO: 'P-0LC262226Y1697300NFP77MY'     // Production Pro plan $1.99/month
    }
};

// Prices Configuration
const PAYPAL_PRICES = {
    sandbox: {
        BOOK: 0.01,           // TEST PRICE
        SCAN_STARTER: 0.01,   // TEST PRICE
        SCAN_VALUE: 0.01,     // TEST PRICE
        SCAN_BUNDLE: 0.01     // TEST PRICE
    },
    production: {
        BOOK: 9.99,           // Book plan one-time purchase
        SCAN_STARTER: 0.99,   // 5 scans
        SCAN_VALUE: 1.99,     // 15 scans
        SCAN_BUNDLE: 4.99     // 50 scans
    }
};

// Get current environment prices
const PAYPAL_ONE_TIME_PRICES = PAYPAL_PRICES[PAYPAL_ENV];

// Scan pack quantities (same for both environments)
const SCAN_PACK_QUANTITIES = {
    SCAN_STARTER: 5,
    SCAN_VALUE: 15,
    SCAN_BUNDLE: 50
};

// Get current Client ID
const PAYPAL_CLIENT_ID = PAYPAL_CLIENT_IDS[PAYPAL_ENV];

// Get current Plan IDs
const CURRENT_PLAN_IDS = PAYPAL_PLAN_IDS[PAYPAL_ENV];

class PayPalSubscriptionManager {
    constructor() {
        this.isSDKLoaded = false;
    }

    /**
     * Initialize PayPal SDK
     */
    init() {
        // Check if PayPal SDK is already loaded
        if (window.paypal) {
            this.isSDKLoaded = true;
            console.log('PayPal SDK already loaded');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
                resolve();
                return;
            }

            // Load PayPal SDK with environment-specific client ID
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=USD`;
            console.log(`Loading PayPal SDK for ${PAYPAL_ENV} environment`);

            script.onload = () => {
                this.isSDKLoaded = true;
                console.log('PayPal SDK loaded successfully');
                resolve();
            };

            script.onerror = () => {
                console.error('Failed to load PayPal SDK');
                reject(new Error('Failed to load PayPal SDK'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Create subscription button for a specific plan
     */
    createSubscriptionButton(planType, containerId) {
        if (!this.isSDKLoaded || !window.paypal) {
            console.error('PayPal SDK not loaded');
            return;
        }

        const planId = CURRENT_PLAN_IDS[planType];
        if (!planId) {
            console.error('Invalid plan type:', planType);
            return;
        }

        // Clear existing button
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        container.innerHTML = '';

        // Render PayPal subscription button
        window.paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'subscribe'
            },

            createSubscription: (data, actions) => {
                return actions.subscription.create({
                    plan_id: planId,
                    custom_id: window.subscriptionManager.currentUser?.uid || 'unknown'
                });
            },

            onApprove: async (data, actions) => {
                console.log('Subscription approved:', data.subscriptionID);

                // Update user subscription in Firebase
                await this.handleSubscriptionApproval(planType, data.subscriptionID);

                // Show success message
                this.showSubscriptionSuccess(planType);

                // Reload subscription data
                if (window.subscriptionManager) {
                    await window.subscriptionManager.init(window.subscriptionManager.currentUser);
                }

                // Close subscription modal
                this.closeSubscriptionModal();
            },

            onError: (err) => {
                console.error('PayPal subscription error:', err);
                this.showSubscriptionError(err);
            },

            onCancel: (data) => {
                console.log('Subscription cancelled by user');
                this.showSubscriptionCancelled();
            }
        }).render(`#${containerId}`);
    }

    /**
     * Handle subscription approval
     */
    async handleSubscriptionApproval(planType, subscriptionId) {
        try {
            const tierMap = {
                'BASIC': 'BASIC',
                'PRO': 'PRO'
            };

            const tier = tierMap[planType];
            if (!tier) {
                throw new Error('Invalid plan type');
            }

            // Update subscription in Firebase
            if (window.subscriptionManager) {
                await window.subscriptionManager.updateSubscription(tier, subscriptionId);
            }

            // Log subscription event
            console.log(`Subscription activated: ${tier} - ${subscriptionId}`);

        } catch (error) {
            console.error('Error handling subscription approval:', error);
            throw error;
        }
    }

    /**
     * Show subscription success message
     */
    showSubscriptionSuccess(planType) {
        const tierName = planType === 'BASIC' ? 'Basic' : 'Pro';
        alert(`🎉 Welcome to aChordim ${tierName}!\n\nYour subscription is now active. Enjoy unlimited access to all features!`);
    }

    /**
     * Show subscription error message
     */
    showSubscriptionError(error) {
        alert(`❌ Subscription Error\n\nSomething went wrong with your subscription. Please try again or contact support.\n\nError: ${error.message || 'Unknown error'}`);
    }

    /**
     * Show subscription cancelled message
     */
    showSubscriptionCancelled() {
        console.log('User cancelled subscription process');
    }

    /**
     * Close subscription modal
     */
    closeSubscriptionModal() {
        const modal = document.getElementById('subscriptionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Cancel existing subscription
     */
    async cancelSubscription(subscriptionId) {
        try {
            // Note: Cancelling requires server-side API call to PayPal
            // This is just the client-side handler
            const confirmed = confirm('Are you sure you want to cancel your subscription?\n\nYou will lose access to premium features at the end of your billing period.');

            if (!confirmed) return;

            // Call your server endpoint to cancel subscription
            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscriptionId: subscriptionId,
                    userId: window.subscriptionManager.currentUser?.uid
                })
            });

            if (response.ok) {
                await window.subscriptionManager.cancelSubscription();
                alert('Your subscription has been cancelled. You will retain access until the end of your billing period.');
            } else {
                throw new Error('Failed to cancel subscription');
            }

        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Failed to cancel subscription. Please contact support.');
        }
    }

    /**
     * Create one-time purchase button for Book plan
     */
    createBookPurchaseButton(containerId) {
        if (!this.isSDKLoaded || !window.paypal) {
            console.error('PayPal SDK not loaded');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        container.innerHTML = '';

        window.paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'blue',
                layout: 'vertical',
                label: 'pay'
            },

            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        description: 'aChordim Book - Lifetime Access',
                        amount: {
                            value: PAYPAL_ONE_TIME_PRICES.BOOK.toFixed(2)
                        },
                        custom_id: window.subscriptionManager.currentUser?.uid || 'unknown'
                    }]
                });
            },

            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                console.log('Book purchase approved:', order.id);

                await this.handleBookPurchaseApproval(order.id);
                this.showPurchaseSuccess('Book');

                if (window.subscriptionManager) {
                    await window.subscriptionManager.init(window.subscriptionManager.currentUser);
                }
                this.closeSubscriptionModal();
            },

            onError: (err) => {
                console.error('PayPal purchase error:', err);
                this.showPurchaseError(err);
            },

            onCancel: () => {
                console.log('Purchase cancelled by user');
            }
        }).render(`#${containerId}`);
    }

    /**
     * Create scan pack purchase button
     */
    createScanPackButton(packType, containerId) {
        if (!this.isSDKLoaded || !window.paypal) {
            console.error('PayPal SDK not loaded');
            return;
        }

        const price = PAYPAL_ONE_TIME_PRICES[packType];
        const scans = SCAN_PACK_QUANTITIES[packType];

        if (!price || !scans) {
            console.error('Invalid scan pack type:', packType);
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }
        container.innerHTML = '';

        window.paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'gold',
                layout: 'vertical',
                label: 'pay',
                height: 35
            },

            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        description: `aChordim ${scans} Scans`,
                        amount: {
                            value: price.toFixed(2)
                        },
                        custom_id: `${window.subscriptionManager.currentUser?.uid || 'unknown'}_${packType}`
                    }]
                });
            },

            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                console.log('Scan pack purchase approved:', order.id);

                await this.handleScanPackApproval(packType, scans, order.id);
                this.showPurchaseSuccess(`${scans} Scans`);

                if (window.subscriptionManager) {
                    await window.subscriptionManager.loadUserPurchasedScans();
                    window.subscriptionManager.notifySubscriptionChange();
                }

                // Update UI if scan pack modal is open
                this.updateScanPackUI();
            },

            onError: (err) => {
                console.error('PayPal purchase error:', err);
                this.showPurchaseError(err);
            },

            onCancel: () => {
                console.log('Scan pack purchase cancelled by user');
            }
        }).render(`#${containerId}`);
    }

    /**
     * Handle Book plan purchase approval
     */
    async handleBookPurchaseApproval(orderId) {
        try {
            if (window.subscriptionManager) {
                // Set tier to BOOK with order ID
                await window.subscriptionManager.updateSubscription('BOOK', orderId);
                // Add initial 20 scans
                await window.subscriptionManager.addPurchasedScans(20);
            }
            console.log(`Book plan activated with order: ${orderId}`);
        } catch (error) {
            console.error('Error handling Book purchase:', error);
            throw error;
        }
    }

    /**
     * Handle scan pack purchase approval
     */
    async handleScanPackApproval(packType, scans, orderId) {
        try {
            if (window.subscriptionManager) {
                await window.subscriptionManager.addPurchasedScans(scans);
            }
            console.log(`Added ${scans} scans with order: ${orderId}`);
        } catch (error) {
            console.error('Error handling scan pack purchase:', error);
            throw error;
        }
    }

    /**
     * Show purchase success message
     */
    showPurchaseSuccess(itemName) {
        alert(`🎉 Purchase Complete!\n\nYour ${itemName} purchase was successful. Enjoy aChordim!`);
    }

    /**
     * Show purchase error message
     */
    showPurchaseError(error) {
        alert(`❌ Purchase Error\n\nSomething went wrong. Please try again.\n\nError: ${error.message || 'Unknown error'}`);
    }

    /**
     * Update scan pack UI after purchase
     */
    updateScanPackUI() {
        const scansDisplay = document.getElementById('currentScansCount');
        if (scansDisplay && window.subscriptionManager) {
            scansDisplay.textContent = window.subscriptionManager.getPurchasedScans();
        }
    }
}

// Create global PayPal subscription manager instance
window.paypalSubscriptionManager = new PayPalSubscriptionManager();
