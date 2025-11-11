/**
 * PayPal Subscription Integration for ChordsApp
 * Handles PayPal subscription buttons and payment processing
 */

// PayPal Plan IDs (You need to create these in your PayPal Developer Dashboard)
const PAYPAL_PLAN_IDS = {
    BASIC: 'P-6PG918695K486915UNEJWL2Q',  // Basic plan $0.99/month
    PRO: 'P-4VN66533B0865510NNEJWZTI'    // Pro plan $1.99/month
};

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

            // Load PayPal SDK
            const script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=AUjr_VTe9_mnojYbrv2wEhvIlYN3nXES7HG2hIfHpNhZchdcNGCh6WeHJtxwXkDBqS09gb2RjX-HAYEK&vault=true&intent=subscription';

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

        const planId = PAYPAL_PLAN_IDS[planType];
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
        alert(`🎉 Welcome to ChordsApp ${tierName}!\n\nYour subscription is now active. Enjoy unlimited access to all features!`);
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
}

// Create global PayPal subscription manager instance
window.paypalSubscriptionManager = new PayPalSubscriptionManager();
