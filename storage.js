// ========================================
// FIREBASE + LOCALSTORAGE STORAGE SERVICE (FIXED)
// ========================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDo2d-XitGzlNIHPG9J6A7RFFUT57L1yjs",
    authDomain: "paid-member-manage.firebaseapp.com",
    projectId: "paid-member-manage",
    storageBucket: "paid-member-manage.firebasestorage.app",
    messagingSenderId: "601892714749",
    appId: "1:601892714749:web:ffc48604ab076a37b9a694",
    measurementId: "G-YYXTYH9ZMV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

class StorageService {
    constructor() {
        this.STORAGE_KEY = 'membership_manager_data';
        this.data = this.getDefaultData();
        this.isFirebaseReady = false;
        this.members = [];
        this.transactions = [];
        this.settings = { theme: 'light', currency: 'MMK' };
        this.lastUpdated = new Date().toISOString();
        this.isLoading = false;
    }

    getDefaultData() {
        return {
            members: [],
            transactions: [],
            settings: { theme: 'light', currency: 'MMK' },
            lastUpdated: new Date().toISOString()
        };
    }

    // ----- Load data from Firebase -----
    async load() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            console.log('📡 Loading data from Firebase...');

            // Load members
            const membersSnapshot = await db.collection('members')
                .orderBy('createdAt', 'desc')
                .get();
            this.members = [];
            membersSnapshot.forEach(doc => {
                this.members.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Load transactions
            const transactionsSnapshot = await db.collection('transactions')
                .orderBy('createdAt', 'desc')
                .get();
            this.transactions = [];
            transactionsSnapshot.forEach(doc => {
                this.transactions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Load settings
            const settingsDoc = await db.collection('settings').doc('appSettings').get();
            if (settingsDoc.exists) {
                this.settings = settingsDoc.data();
            }

            this.isFirebaseReady = true;
            this.lastUpdated = new Date().toISOString();

            // Save to localStorage as backup
            this.backupToLocalStorage();

            console.log(`✅ Firebase loaded: ${this.members.length} members, ${this.transactions.length} transactions`);
            this.isLoading = false;
            return this.data;

        } catch (error) {
            console.error('❌ Firebase load error:', error);
            console.log('📦 Falling back to localStorage...');
            this.loadFromLocalStorage();
            this.isLoading = false;
            return this.data;
        }
    }

    // ----- Backup to localStorage -----
    backupToLocalStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                members: this.members,
                transactions: this.transactions,
                settings: this.settings,
                lastUpdated: this.lastUpdated
            }));
        } catch (e) {
            console.error('Backup error:', e);
        }
    }

    // ----- Load from localStorage (fallback) -----
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.members = parsed.members || [];
                this.transactions = parsed.transactions || [];
                this.settings = parsed.settings || { theme: 'light', currency: 'MMK' };
                this.lastUpdated = parsed.lastUpdated || new Date().toISOString();
                console.log(`📦 localStorage loaded: ${this.members.length} members, ${this.transactions.length} transactions`);
            }
        } catch (e) {
            console.error('localStorage load error:', e);
        }
    }

    // ----- Save data to Firebase (FIXED) -----
    async save() {
        try {
            this.lastUpdated = new Date().toISOString();

            // Save members to Firestore - Filter out undefined values
            const membersCollection = db.collection('members');
            for (const member of this.members) {
                const { id, ...memberData } = member;
                // Remove undefined values
                const cleanData = this.removeUndefined(memberData);
                await membersCollection.doc(id).set(cleanData, { merge: true });
            }

            // Save transactions to Firestore - Filter out undefined values
            const transactionsCollection = db.collection('transactions');
            for (const transaction of this.transactions) {
                const { id, ...transactionData } = transaction;
                // Remove undefined values
                const cleanData = this.removeUndefined(transactionData);
                await transactionsCollection.doc(id).set(cleanData, { merge: true });
            }

            // Save settings
            await db.collection('settings').doc('appSettings').set(this.settings, { merge: true });

            // Backup to localStorage
            this.backupToLocalStorage();

            console.log('✅ Data saved to Firebase successfully!');
            return true;

        } catch (error) {
            console.error('❌ Firebase save error:', error);
            // Fallback: Save to localStorage only
            this.backupToLocalStorage();
            return false;
        }
    }

    // ----- Helper: Remove undefined values from object -----
    removeUndefined(obj) {
        const result = {};
        for (const key in obj) {
            if (obj[key] !== undefined && obj[key] !== null) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    // ----- Get all members -----
    getMembers() {
        return this.members || [];
    }

    // ----- Get all transactions -----
    getTransactions() {
        return this.transactions || [];
    }

    // ----- Get a single member by ID -----
    getMember(id) {
        return this.members.find(m => m.id === id) || null;
    }

    // ----- Add a new member (FIXED) -----
    async addMember(memberData) {
        const purchaseDate = memberData.purchaseDate || new Date().toISOString().split('T')[0];
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        const member = {
            id: id,
            username: memberData.username || '',
            product: memberData.product || '',
            plan: memberData.plan || '',
            price: memberData.price || 0,
            paymentMethod: memberData.paymentMethod || '',
            purchaseDate: purchaseDate,
            expiryDate: memberData.expiryDate || '',
            notes: memberData.notes || '',
            createdAt: new Date(purchaseDate).toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            history: []
        };

        this.members.unshift(member);
        await this.save();
        return member;
    }

    // ----- Update an existing member -----
    async updateMember(id, updates) {
        const index = this.members.findIndex(m => m.id === id);
        if (index === -1) return null;

        this.members[index] = {
            ...this.members[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        await this.save();
        return this.members[index];
    }

    // ----- Delete a member -----
    async deleteMember(id) {
        this.members = this.members.filter(m => m.id !== id);
        await this.save();
        return true;
    }

    // ----- Add a transaction (FIXED) -----
    async addTransaction(transactionData) {
        const purchaseDate = transactionData.purchaseDate || new Date().toISOString().split('T')[0];
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        const transaction = {
            id: id,
            memberId: transactionData.memberId || '',
            username: transactionData.username || '',
            product: transactionData.product || '',
            plan: transactionData.plan || '',
            amount: transactionData.amount || 0,
            paymentMethod: transactionData.paymentMethod || '',
            purchaseDate: purchaseDate,
            expiryDate: transactionData.expiryDate || '',
            type: transactionData.type || 'purchase',
            createdAt: new Date(purchaseDate).toISOString()
        };

        this.transactions.unshift(transaction);
        await this.save();
        return transaction;
    }

    // ----- Get transactions for a specific member -----
    getMemberTransactions(memberId) {
        return this.transactions.filter(t => t.memberId === memberId);
    }

    // ----- Calculate total revenue -----
    getTotalRevenue() {
        return this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    // ----- Get storage statistics -----
    getStats() {
        return {
            totalMembers: this.members.length,
            totalTransactions: this.transactions.length,
            totalRevenue: this.getTotalRevenue(),
            storageUsed: new Blob([localStorage.getItem(this.STORAGE_KEY)]).size,
            lastUpdated: this.lastUpdated,
            isFirebaseConnected: this.isFirebaseReady
        };
    }

    // ----- Export all data as JSON -----
    exportData() {
        return JSON.stringify({
            members: this.members,
            transactions: this.transactions,
            settings: this.settings,
            lastUpdated: this.lastUpdated
        }, null, 2);
    }

    // ----- Import data from JSON -----
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (!data.members || !data.transactions) throw new Error('Invalid data');

            this.members = data.members || [];
            this.transactions = data.transactions || [];
            this.settings = data.settings || { theme: 'light', currency: 'MMK' };
            this.lastUpdated = new Date().toISOString();

            await this.save();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // ----- Clear all data -----
    async clearAllData() {
        try {
            // Clear Firebase data
            const membersSnapshot = await db.collection('members').get();
            for (const doc of membersSnapshot.docs) {
                await doc.ref.delete();
            }

            const transactionsSnapshot = await db.collection('transactions').get();
            for (const doc of transactionsSnapshot.docs) {
                await doc.ref.delete();
            }

            await db.collection('settings').doc('appSettings').delete();

        } catch (e) {
            console.error('Firebase clear error:', e);
        }

        this.members = [];
        this.transactions = [];
        this.settings = { theme: 'light', currency: 'MMK' };
        this.lastUpdated = new Date().toISOString();
        localStorage.removeItem(this.STORAGE_KEY);
        await this.save();
        return true;
    }

    // ----- Sync data from Firebase (refresh) -----
    async sync() {
        await this.load();
        return this.data;
    }
}

// Create a singleton instance
const storage = new StorageService();

// Auto-load data when script loads
document.addEventListener('DOMContentLoaded', async () => {
    await storage.load();
    console.log('✅ Storage initialized with Firebase + LocalStorage!');
    console.log(`📊 ${storage.members.length} members, ${storage.transactions.length} transactions`);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
}
