/**
 * ChordsApp Subscription Management
 * Handles subscription tiers, usage tracking, and feature access control
 */

// Environment Detection
const SUBSCRIPTION_ENV = (() => {
    const hostname = window.location.hostname;
    const isLocalDev = hostname === 'localhost' ||
                       hostname === '127.0.0.1' ||
                       hostname.startsWith('192.168.') ||
                       hostname.startsWith('10.') ||
                       hostname.startsWith('172.');
    return isLocalDev ? 'sandbox' : 'production';
})();

// Prices per environment
const TIER_PRICES = {
    sandbox: {
        FREE: 0,
        BASIC: 0.01,      // TEST PRICE
        PRO: 0.01,        // TEST PRICE
        BOOK: 0.01        // TEST PRICE
    },
    production: {
        FREE: 0,
        BASIC: 0.99,      // $0.99/month
        PRO: 1.99,        // $1.99/month
        BOOK: 9.99        // $9.99 one-time
    }
};

const CURRENT_PRICES = TIER_PRICES[SUBSCRIPTION_ENV];

// Subscription Tiers Configuration
const SUBSCRIPTION_TIERS = {
    FREE: {
        name: 'Free',
        price: CURRENT_PRICES.FREE,
        analysesPerMonth: 3,
        canSave: false,
        nashvilleNumbers: false,
        canCreateSession: false,
        canJoinSession: false,
        features: ['3 AI analyses/month', 'Transpose', 'Print/Export']
    },
    BASIC: {
        name: 'Basic',
        price: CURRENT_PRICES.BASIC,
        analysesPerMonth: 20,
        canSave: true,
        nashvilleNumbers: false,
        canCreateSession: false,
        canJoinSession: true,
        features: ['20 AI analyses/month', 'Save to Library', 'Transpose', 'Print/Export']
    },
    PRO: {
        name: 'Pro',
        price: CURRENT_PRICES.PRO,
        analysesPerMonth: -1, // -1 means unlimited
        canSave: true,
        nashvilleNumbers: true,
        canCreateSession: true,
        canJoinSession: true,
        features: ['Unlimited AI analyses', 'Save to Library', 'Nashville Numbers', 'Live Sessions', 'Transpose', 'Print/Export']
    },
    BOOK: {
        name: 'Book',
        price: CURRENT_PRICES.BOOK,
        isOneTime: true,           // One-time purchase, not subscription
        initialScans: 20,          // Included with purchase
        analysesPerMonth: 0,       // Uses purchased scans instead
        canSave: true,
        nashvilleNumbers: true,
        canCreateSession: false,
        canJoinSession: false,
        features: ['20 AI scans included', 'Save to Library', 'Nashville Numbers', 'Buy scan packs', 'Transpose', 'Print/Export']
    }
};

// Scan Pack Prices per environment
const SCAN_PACK_PRICES = {
    sandbox: {
        STARTER: 0.01,    // TEST PRICE
        VALUE: 0.01,      // TEST PRICE
        BUNDLE: 0.01      // TEST PRICE
    },
    production: {
        STARTER: 0.99,    // $0.99 for 5 scans
        VALUE: 1.99,      // $1.99 for 15 scans
        BUNDLE: 4.99      // $4.99 for 50 scans
    }
};

const CURRENT_SCAN_PRICES = SCAN_PACK_PRICES[SUBSCRIPTION_ENV];

// Scan Pack Configuration (for BOOK tier users)
const SCAN_PACKS = {
    STARTER: {
        name: 'Starter Pack',
        scans: 5,
        price: CURRENT_SCAN_PRICES.STARTER
    },
    VALUE: {
        name: 'Value Pack',
        scans: 15,
        price: CURRENT_SCAN_PRICES.VALUE
    },
    BUNDLE: {
        name: 'Bundle Pack',
        scans: 50,
        price: CURRENT_SCAN_PRICES.BUNDLE
    }
};

class SubscriptionManager {
    constructor() {
        this.currentUser = null;
        this.userSubscription = null;
        this.userUsage = null;
        this.userPurchasedScans = 0;  // For BOOK tier users
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
            await this.loadUserPurchasedScans();
            this.checkAndResetMonthlyUsage();
        } else {
            this.userSubscription = null;
            this.userUsage = null;
            this.userPurchasedScans = 0;
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
     * Load user purchased scans from Firebase (for BOOK tier)
     */
    async loadUserPurchasedScans() {
        if (!this.currentUser) return;

        return new Promise((resolve) => {
            const scansRef = firebase.database().ref(`users/${this.currentUser.uid}/purchasedScans`);
            scansRef.once('value', (snapshot) => {
                this.userPurchasedScans = snapshot.val() || 0;
                resolve();
            });
        });
    }

    /**
     * Add purchased scans to user account
     */
    async addPurchasedScans(amount) {
        if (!this.currentUser) return;

        this.userPurchasedScans += amount;
        await firebase.database().ref(`users/${this.currentUser.uid}/purchasedScans`)
            .set(this.userPurchasedScans);

        console.log(`✅ Added ${amount} scans. Total: ${this.userPurchasedScans}`);
        this.notifySubscriptionChange();
    }

    /**
     * Use one purchased scan (for BOOK tier)
     */
    async usePurchasedScan() {
        if (!this.currentUser || this.userPurchasedScans <= 0) return false;

        this.userPurchasedScans -= 1;
        await firebase.database().ref(`users/${this.currentUser.uid}/purchasedScans`)
            .set(this.userPurchasedScans);

        console.log(`Used 1 scan. Remaining: ${this.userPurchasedScans}`);
        return true;
    }

    /**
     * Get remaining purchased scans
     */
    getPurchasedScans() {
        return this.userPurchasedScans;
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
        const currentTier = this.getCurrentTier();

        // Unlimited analyses for Pro
        if (tier.analysesPerMonth === -1) return true;

        // BOOK tier uses purchased scans
        if (currentTier === 'BOOK') {
            return this.userPurchasedScans > 0;
        }

        // Check if user has analyses left
        const used = this.userUsage?.analysesThisMonth || 0;
        return used < tier.analysesPerMonth;
    }

    /**
     * Get remaining analyses for current month
     */
    getRemainingAnalyses() {
        const tier = this.getTierConfig();
        const currentTier = this.getCurrentTier();

        if (tier.analysesPerMonth === -1) return 'Unlimited';

        // BOOK tier shows purchased scans
        if (currentTier === 'BOOK') {
            return this.userPurchasedScans;
        }

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
            // Detect local development (localhost or local network IP)
            const isLocalDev = window.location.hostname === 'localhost' ||
                               window.location.hostname.startsWith('192.168.') ||
                               window.location.hostname.startsWith('10.') ||
                               window.location.hostname.startsWith('172.');

            const API_URL = isLocalDev
                ? `http://${window.location.hostname}:3002/api/increment-analysis`
                : 'https://us-central1-chordsapp-e10e7.cloudfunctions.net/incrementAnalysis';

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
     * Check if user can create live sessions
     */
    canCreateSession() {
        if (!this.currentUser) return false;
        const tier = this.getTierConfig();
        return tier.canCreateSession === true;
    }

    /**
     * Check if user can join live sessions
     */
    canJoinSession() {
        if (!this.currentUser) return false;
        const tier = this.getTierConfig();
        return tier.canJoinSession === true;
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
     * Refresh user usage data from Firebase (useful before showing modals)
     */
    async refreshUserUsage() {
        if (!this.currentUser) return;
        await this.loadUserUsage();
        this.checkAndResetMonthlyUsage();
    }

    /**
     * Get usage summary for display
     */
    getUsageSummary() {
        const tier = this.getTierConfig();
        const currentTier = this.getCurrentTier();
        const used = this.userUsage?.analysesThisMonth || 0;
        const limit = tier.analysesPerMonth;

        // BOOK tier uses purchased scans
        const isBook = currentTier === 'BOOK';
        const analysesRemaining = limit === -1 ? 'Unlimited'
            : isBook ? this.userPurchasedScans
            : Math.max(0, limit - used);

        return {
            tier: currentTier,
            tierName: tier.name,
            price: tier.price,
            isOneTime: tier.isOneTime || false,
            analysesUsed: isBook ? 0 : used,
            analysesLimit: isBook ? 'Pay-per-scan' : limit,
            analysesRemaining: analysesRemaining,
            purchasedScans: this.userPurchasedScans,
            canAnalyze: this.canAnalyze(),
            canSave: this.canSaveSongs(),
            canUseNashville: this.canUseNashvilleNumbers(),
            canCreateSession: this.canCreateSession(),
            canJoinSession: this.canJoinSession(),
            features: tier.features
        };
    }
}

// Export SCAN_PACKS for use in other modules
window.SCAN_PACKS = SCAN_PACKS;

// Export environment info
window.CHORDSAPP_ENV = SUBSCRIPTION_ENV;
console.log(`ChordsApp Environment: ${SUBSCRIPTION_ENV}`);
console.log(`Prices: Basic=$${CURRENT_PRICES.BASIC}, Pro=$${CURRENT_PRICES.PRO}, Book=$${CURRENT_PRICES.BOOK}`);

// Create global subscription manager instance
window.subscriptionManager = new SubscriptionManager();
