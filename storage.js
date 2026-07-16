/**
 * ========================================
 * LocalStorage Service
 * Handles all data persistence operations
 * ========================================
 */

class StorageService {
    constructor() {
        this.STORAGE_KEY = 'membership_manager_data';
        this.data = this.load();
    }

    /**
     * Initialize default data structure
     */
    getDefaultData() {
        return {
            members: [],
            transactions: [],
            settings: {
                theme: 'light',
                currency: 'MMK',
                taxRate: 0
            },
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Load data from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure all required keys exist
                return {
                    ...this.getDefaultData(),
                    ...parsed
                };
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return this.getDefaultData();
    }

    /**
     * Save data to localStorage
     */
    save() {
        try {
            this.data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    /**
     * Get all members
     */
    getMembers() {
        return this.data.members || [];
    }

    /**
     * Get a single member by ID
     */
    getMember(id) {
        return this.data.members.find(m => m.id === id) || null;
    }

    /**
     * Add a new member
     */
    addMember(memberData) {
        // Use the purchase date from the form, not current date
        const purchaseDate = memberData.purchaseDate || new Date().toISOString().split('T')[0];
    
        const member = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            ...memberData,
            createdAt: new Date(purchaseDate).toISOString(), // Use purchase date
            updatedAt: new Date().toISOString(),
            isActive: true,
            history: []
        };
        this.data.members.push(member);
        this.save();
        return member;
    }

    /**
     * Update an existing member
     */
    updateMember(id, updates) {
        const index = this.data.members.findIndex(m => m.id === id);
        if (index === -1) return null;
        
        this.data.members[index] = {
            ...this.data.members[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data.members[index];
    }

    // ----- Delete a member (SOFT DELETE) -----
async deleteMember(id) {
    const member = this.getMember(id);
    if (!member) return false;
    
    // Mark as deleted instead of removing
    const index = this.members.findIndex(m => m.id === id);
    this.members[index] = {
        ...member,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        username: `${member.username} (Deleted)`
    };
    await this.save();
    return true;
}

// ----- Get members (excluding deleted) -----
getMembers() {
    return this.members.filter(m => !m.isDeleted);
}

// ----- Get all members including deleted -----
getAllMembers() {
    return this.members || [];
}

// ----- Get member (including deleted) -----
getMember(id) {
    return this.members.find(m => m.id === id) || null;
}
    /**
     * Get all transactions
     */
    getTransactions() {
        return this.data.transactions || [];
    }

    /**
     * Add a transaction
     */
    addTransaction(transactionData) {
        // Use purchase date for transaction creation date
        const purchaseDate = transactionData.purchaseDate || new Date().toISOString().split('T')[0];
    
        const transaction = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            ...transactionData,
            createdAt: new Date(purchaseDate).toISOString() // FIXED: Use purchase date
        };
        this.data.transactions.push(transaction);
        this.save();
        return transaction;
    }

    /**
     * Get transactions for a specific member
     */
    getMemberTransactions(memberId) {
        return this.data.transactions.filter(t => t.memberId === memberId);
    }

    /**
     * Get transactions for a date range
     */
    getTransactionsByDate(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return this.data.transactions.filter(t => {
            const date = new Date(t.createdAt);
            return date >= start && date <= end;
        });
    }

    /**
     * Calculate total revenue
     */
    getTotalRevenue() {
        return this.data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    /**
     * Get revenue by date
     */
    getRevenueByDate(date) {
        const target = new Date(date);
        return this.data.transactions
            .filter(t => {
                const tDate = new Date(t.createdAt);
                return tDate.toDateString() === target.toDateString();
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    /**
     * Get revenue by month
     */
    getRevenueByMonth(year, month) {
        return this.data.transactions
            .filter(t => {
                const date = new Date(t.createdAt);
                return date.getFullYear() === year && date.getMonth() === month;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    /**
     * Get members by product
     */
    getMembersByProduct(product) {
        return this.data.members.filter(m => m.product === product);
    }

    /**
     * Get members by subscription plan
     */
    getMembersByPlan(plan) {
        return this.data.members.filter(m => m.plan === plan);
    }

    /**
     * Get members by payment method
     */
    getMembersByPayment(payment) {
        return this.data.members.filter(m => m.paymentMethod === payment);
    }

    /**
     * Get expired members
     */
    getExpiredMembers() {
        const now = new Date();
        return this.data.members.filter(m => {
            if (!m.expiryDate) return false;
            return new Date(m.expiryDate) < now;
        });
    }

    /**
     * Get members expiring soon (within 7 days)
     */
    getMembersExpiringSoon() {
        const now = new Date();
        const sevenDays = new Date(now);
        sevenDays.setDate(sevenDays.getDate() + 7);
        
        return this.data.members.filter(m => {
            if (!m.expiryDate) return false;
            const expiry = new Date(m.expiryDate);
            return expiry >= now && expiry <= sevenDays;
        });
    }

    /**
     * Generate a unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Export all data as JSON
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Import data from JSON
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Validate data structure
            if (!data.members || !data.transactions) {
                throw new Error('Invalid data structure');
            }
            this.data = {
                ...this.getDefaultData(),
                ...data
            };
            this.save();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all data (with confirmation)
     */
    clearAllData() {
        this.data = this.getDefaultData();
        this.save();
        return true;
    }

    /**
     * Get storage statistics
     */
    getStats() {
        return {
            totalMembers: this.data.members.length,
            totalTransactions: this.data.transactions.length,
            totalRevenue: this.getTotalRevenue(),
            storageUsed: new Blob([localStorage.getItem(this.STORAGE_KEY)]).size,
            lastUpdated: this.data.lastUpdated
        };
    }
}

// Create a singleton instance
const storage = new StorageService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
}
