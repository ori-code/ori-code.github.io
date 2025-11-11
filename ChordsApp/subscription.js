/**
 * ChordsApp Subscription Management
 * Handles subscription tiers, usage tracking, and feature access control
 */

// Subscription Tiers Configuration
const SUBSCRIPTION_TIERS = {
    FREE: {
        name: 'Free',
        price: 0,
        analysesPerMonth: 3,
        canSave: false,
        nashvilleNumbers: false,
        features: ['3 AI analyses/month', 'Transpose', 'Print/Export']
    },
    BASIC: {
        name: 'Basic',
        price: 0.99,
        analysesPerMonth: 20,
        canSave: true,
        nashvilleNumbers: false,
        features: ['20 AI analyses/month', 'Save to Library', 'Transpose', 'Print/Export']
    },
    PRO: {
        name: 'Pro',
        price: 1.99,
        analysesPerMonth: -1, // -1 means unlimited
        canSave: true,
        nashvilleNumbers: true,
        features: ['Unlimited AI analyses', 'Save to Library', 'Nashville Numbers', 'Transpose', 'Print/Export']
    }
};

class SubscriptionManager {
    constructor() {
        this.currentUser = null;
        this.userSubscription = null;
        this.userUsage = null;
        this.onSubscriptionChangeCallbacks = [];
    }

    /**
     * Initialize subscription manager with current user
     */
    async init(user) {
        this.currentUser = user;
        if (user) {
            await this.loadUserSubscription();
            await this.loadUserUsage();
            this.checkAndResetMonthlyUsage();
        } else {
            this.userSubscription = null;
            this.userUsage = null;
        }
        this.notifySubscriptionChange();
    }

    /**
     * Load user subscription data from Firebase
     */
    async loadUserSubscription() {
        if (!this.currentUser) return;

        return new Promise((resolve) => {
            const subRef = firebase.database().ref(`users/${this.currentUser.uid}/subscription`);
            subRef.once('value', async (snapshot) => {
                const data = snapshot.val();

                if (!data) {
                    // Create initial subscription structure for new user
                    this.userSubscription = {
                        tier: 'FREE',
                        status: 'active',
                        startDate: new Date().toISOString(),
                        paypalSubscriptionId: null,
                        endDate: null
                    };

                    // Write to Firebase
                    try {
                        await subRef.set(this.userSubscription);
                        console.log('✅ Created initial subscription structure for new user');
                    } catch (error) {
                        console.error('❌ Error creating subscription structure:', error);
                    }
                } else {
                    this.userSubscription = data;
                }

                resolve();
            });
        });
    }

    /**
     * Load user usage data from Firebase
     */
    async loadUserUsage() {
        if (!this.currentUser) return;

        return new Promise((resolve) => {
            const usageRef = firebase.database().ref(`users/${this.currentUser.uid}/usage`);
            usageRef.once('value', async (snapshot) => {
                const data = snapshot.val();

                if (!data) {
                    // Create initial usage structure for new user
                    this.userUsage = {
                        analysesThisMonth: 0,
                        monthStartDate: new Date().toISOString()
                    };

                    // Write to Firebase
                    try {
                        await usageRef.set(this.userUsage);
                        console.log('✅ Created initial usage structure for new user');
                    } catch (error) {
                        console.error('❌ Error creating usage structure:', error);
                    }
                } else {
                    this.userUsage = data;
                }

                resolve();
            });
        });
    }

    /**
     * Check if we need to reset monthly usage counter
     */
    checkAndResetMonthlyUsage() {
        if (!this.userUsage) return;

        const monthStart = new Date(this.userUsage.monthStartDate);
        const now = new Date();

        // Check if we're in a new month
        if (monthStart.getMonth() !== now.getMonth() || monthStart.getFullYear() !== now.getFullYear()) {
            this.resetMonthlyUsage();
        }
    }

    /**
     * Reset monthly usage counter
     */
    async resetMonthlyUsage() {
        if (!this.currentUser) return;

        this.userUsage = {
            analysesThisMonth: 0,
            monthStartDate: new Date().toISOString()
        };

        await firebase.database().ref(`users/${this.currentUser.uid}/usage`).set(this.userUsage);
    }

    /**
     * Get current subscription tier
     */
    getCurrentTier() {
        if (!this.userSubscription) return 'FREE';
        return this.userSubscription.tier || 'FREE';
    }

    /**
     * Get tier configuration
     */
    getTierConfig(tier = null) {
        const currentTier = tier || this.getCurrentTier();
        return SUBSCRIPTION_TIERS[currentTier] || SUBSCRIPTION_TIERS.FREE;
    }

    /**
     * Check if user can perform AI analysis
     */
    canAnalyze() {
        if (!this.currentUser) return false;

        const tier = this.getTierConfig();

        // Unlimited analyses for Pro
        if (tier.analysesPerMonth === -1) return true;

        // Check if user has analyses left
        const used = this.userUsage?.analysesThisMonth || 0;
        return used < tier.analysesPerMonth;
    }

    /**
     * Get remaining analyses for current month
     */
    getRemainingAnalyses() {
        const tier = this.getTierConfig();

        if (tier.analysesPerMonth === -1) return 'Unlimited';

        const used = this.userUsage?.analysesThisMonth || 0;
        const remaining = Math.max(0, tier.analysesPerMonth - used);
        return remaining;
    }

    /**
     * Increment analysis counter (SERVER-SIDE ONLY)
     */
    async incrementAnalysisCount() {
        if (!this.currentUser) return;

        try {
            // Get Firebase ID token for authentication
            const idToken = await this.currentUser.getIdToken();

            // Call server API to increment count
            const API_URL = window.location.hostname === 'localhost'
                ? 'http://localhost:3002/api/increment-analysis'
                : 'https://ori-code-github-io.vercel.app/api/increment-analysis';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to increment analysis count');
            }

            const result = await response.json();

            // Update local usage count
            if (result.usedBonus) {
                console.log(`Used bonus analysis. ${result.bonusRemaining} bonus analyses remaining.`);
            } else {
                this.userUsage.analysesThisMonth = result.analysesThisMonth;
                console.log(`Analysis count incremented to ${result.analysesThisMonth}`);
            }

        } catch (error) {
            console.error('Error incrementing analysis count:', error);
        }
    }

    /**
     * Check if user can save songs
     */
    canSaveSongs() {
        if (!this.currentUser) return false;
        const tier = this.getTierConfig();
        return tier.canSave;
    }

    /**
     * Check if user can use Nashville Numbers
     */
    canUseNashvilleNumbers() {
        if (!this.currentUser) return false;
        const tier = this.getTierConfig();
        return tier.nashvilleNumbers;
    }

    /**
     * Update user subscription tier
     */
    async updateSubscription(tier, paypalSubscriptionId = null) {
        if (!this.currentUser) return;

        this.userSubscription = {
            tier: tier,
            status: 'active',
            startDate: this.userSubscription?.startDate || new Date().toISOString(),
            paypalSubscriptionId: paypalSubscriptionId,
            endDate: null
        };

        await firebase.database().ref(`users/${this.currentUser.uid}/subscription`)
            .set(this.userSubscription);

        this.notifySubscriptionChange();
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription() {
        if (!this.currentUser || !this.userSubscription) return;

        this.userSubscription.status = 'canceled';
        this.userSubscription.endDate = new Date().toISOString();

        await firebase.database().ref(`users/${this.currentUser.uid}/subscription`)
            .set(this.userSubscription);

        this.notifySubscriptionChange();
    }

    /**
     * Register callback for subscription changes
     */
    onSubscriptionChange(callback) {
        this.onSubscriptionChangeCallbacks.push(callback);
    }

    /**
     * Notify all callbacks of subscription change
     */
    notifySubscriptionChange() {
        this.onSubscriptionChangeCallbacks.forEach(callback => {
            callback({
                tier: this.getCurrentTier(),
                tierConfig: this.getTierConfig(),
                subscription: this.userSubscription,
                usage: this.userUsage
            });
        });
    }

    /**
     * Get usage summary for display
     */
    getUsageSummary() {
        const tier = this.getTierConfig();
        const used = this.userUsage?.analysesThisMonth || 0;
        const limit = tier.analysesPerMonth;

        return {
            tier: this.getCurrentTier(),
            tierName: tier.name,
            price: tier.price,
            analysesUsed: used,
            analysesLimit: limit,
            analysesRemaining: limit === -1 ? 'Unlimited' : Math.max(0, limit - used),
            canAnalyze: this.canAnalyze(),
            canSave: this.canSaveSongs(),
            canUseNashville: this.canUseNashvilleNumbers(),
            features: tier.features
        };
    }
}

// Create global subscription manager instance
window.subscriptionManager = new SubscriptionManager();
