/**
 * ========================================
 * Members Module
 * Manages member CRUD operations
 * ========================================
 */

class Members {
    constructor(container) {
        this.container = container;
        this.members = storage.getMembers();
        this.transactions = storage.getTransactions();
        this.currentPage = 1;
        this.pageSize = 20;
        this.filters = {
            search: '',
            product: 'all',
            payment: 'all',
            plan: 'all',
            status: 'all'
        };
        this.sortBy = 'newest';
        this.selectedMemberId = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="members-page">
                <div class="page-header">
                    <h1>Members Management</h1>
                    <button class="btn btn-primary" onclick="app.members.showAddMember()">
                        + Add Member
                    </button>
                </div>

                <!-- Filters -->
                <div class="filters-bar glass">
                    <div class="search-box">
                        <input type="text" id="memberSearch" placeholder="Search by username..." />
                        <span class="search-icon">🔍</span>
                    </div>
                    <div class="filter-group">
                        <select id="filterProduct" class="filter-select">
                            <option value="all">All Products</option>
                            <option value="Doujinshi">Doujinshi</option>
                            <option value="Manhwa">Manhwa</option>
                        </select>
                        <select id="filterPlan" class="filter-select">
                            <option value="all">All Plans</option>
                            <option value="1 Month">1 Month</option>
                            <option value="3 Months">3 Months</option>
                            <option value="6 Months">6 Months</option>
                            <option value="9 Months">9 Months</option>
                            <option value="12 Months">12 Months</option>
                            <option value="Lifetime">Lifetime</option>
                        </select>
                        <select id="filterPayment" class="filter-select">
                            <option value="all">All Payments</option>
                            <option value="KPay">KPay</option>
                            <option value="Wave Pay">Wave Pay</option>
                            <option value="Aya Pay">Aya Pay</option>
                        </select>
                        <select id="filterStatus" class="filter-select">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="expiring">Expiring Soon</option>
                        </select>
                    </div>
                    <div class="sort-group">
                        <select id="sortBy" class="filter-select">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="username">Username (A-Z)</option>
                            <option value="revenue">Highest Revenue</option>
                            <option value="expiry">Expiry Date</option>
                        </select>
                    </div>
                </div>

                <!-- Stats Summary -->
                <div class="members-stats" id="membersStats">
                    ${this.renderStats()}
                </div>

                <!-- Members Table -->
                <div class="members-table-container glass">
                    <div id="membersTable">
                        ${this.renderTable()}
                    </div>
                </div>

                <!-- Pagination -->
                <div class="pagination" id="pagination">
                    ${this.renderPagination()}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    renderStats() {
        const filtered = this.getFilteredMembers();
        const total = filtered.length;
        const active = filtered.filter(m => {
            if (!m.expiryDate) return false;
            return new Date(m.expiryDate) >= new Date();
        }).length;
        const expired = total - active;
        const totalRevenue = this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        return `
            <div class="stats-mini-grid">
                <div class="stat-mini">
                    <span class="stat-mini-label">Total Members</span>
                    <span class="stat-mini-value">${total}</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-label">Active</span>
                    <span class="stat-mini-value" style="color: var(--success);">${active}</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-label">Expired</span>
                    <span class="stat-mini-value" style="color: var(--danger);">${expired}</span>
                </div>
                <div class="stat-mini">
                    <span class="stat-mini-label">Total Revenue</span>
                    <span class="stat-mini-value">${UI.formatCurrency(totalRevenue)}</span>
                </div>
            </div>
        `;
    }

    renderTable() {
        const filtered = this.getFilteredMembers();
        const sorted = this.sortMembers(filtered);
        const start = (this.currentPage - 1) * this.pageSize;
        const paginated = sorted.slice(start, start + this.pageSize);

        if (paginated.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No members found</h3>
                    <p>Try adjusting your filters or add a new member.</p>
                </div>
            `;
        }

        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Product</th>
                        <th>Plan</th>
                        <th>Payment</th>
                        <th>Price</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        paginated.forEach(member => {
            const status = UI.getExpiryStatus(member.expiryDate);
            const statusClass = status.type;
            const isExpired = status.type === 'danger';
            
            // Get member's total revenue
            const revenue = this.transactions
                .filter(t => t.memberId === member.id)
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            html += `
                <tr class="${isExpired ? 'expired-row' : ''}" onclick="app.members.showMemberProfile('${member.id}')">
                    <td><strong>${member.username}</strong></td>
                    <td><span class="product-badge ${member.product.toLowerCase()}">${member.product}</span></td>
                    <td>${member.plan || 'N/A'}</td>
                    <td><span class="payment-badge ${member.paymentMethod?.toLowerCase().replace(' ', '') || ''}">${member.paymentMethod || 'N/A'}</span></td>
                    <td>${UI.formatCurrency(member.price || 0)}</td>
                    <td>${member.expiryDate ? UI.formatDate(member.expiryDate) : 'N/A'}</td>
                    <td><span class="status-badge status-${statusClass}">${status.label}</span></td>
                    <td>
                        <button class="btn-icon" onclick="event.stopPropagation(); app.members.showMemberProfile('${member.id}')" title="View Profile">
                            👁️                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); app.members.renewMember('${member.id}')" title="Renew">
                            🔄
                        </button>
                        <button class="btn-icon" onclick="event.stopPropagation(); app.members.deleteMember('${member.id}')" title="Delete">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    renderPagination() {
        const filtered = this.getFilteredMembers();
        const totalPages = Math.ceil(filtered.length / this.pageSize);

        if (totalPages <= 1) return '';

        let html = '<div class="pagination-controls">';
        html += `<button class="page-btn" onclick="app.members.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>←</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<span class="page-current">${i}</span>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                html += `<button class="page-btn" onclick="app.members.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span class="page-ellipsis">…</span>';
            }
        }
        
        html += `<button class="page-btn" onclick="app.members.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>→</button>`;
        html += '</div>';
        
        return html;
    }

    getFilteredMembers() {
        let filtered = [...this.members];

        // Search
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(m => 
                m.username.toLowerCase().includes(search)
            );
        }

        // Product filter
        if (this.filters.product !== 'all') {
            filtered = filtered.filter(m => m.product === this.filters.product);
        }

        // Plan filter
        if (this.filters.plan !== 'all') {
            filtered = filtered.filter(m => m.plan === this.filters.plan);
        }

        // Payment filter
        if (this.filters.payment !== 'all') {
            filtered = filtered.filter(m => m.paymentMethod === this.filters.payment);
        }

        // Status filter
        if (this.filters.status !== 'all') {
            const now = new Date();
            filtered = filtered.filter(m => {
                if (!m.expiryDate) return false;
                const expiry = new Date(m.expiryDate);
                const daysDiff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                
                if (this.filters.status === 'active') return daysDiff > 7;
                if (this.filters.status === 'expiring') return daysDiff >= 0 && daysDiff <= 7;
                if (this.filters.status === 'expired') return daysDiff < 0;
                return true;
            });
        }

        return filtered;
    }

    sortMembers(members) {
        const sorted = [...members];

        switch(this.sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'username':
                return sorted.sort((a, b) => a.username.localeCompare(b.username));
            case 'revenue':
                return sorted.sort((a, b) => {
                    const revA = this.transactions.filter(t => t.memberId === a.id).reduce((sum, t) => sum + (t.amount || 0), 0);
                    const revB = this.transactions.filter(t => t.memberId === b.id).reduce((sum, t) => sum + (t.amount || 0), 0);
                    return revB - revA;
                });
            case 'expiry':
                return sorted.sort((a, b) => {
                    if (!a.expiryDate) return 1;
                    if (!b.expiryDate) return -1;
                    return new Date(a.expiryDate) - new Date(b.expiryDate);
                });
            default:
                return sorted;
        }
    }

    goToPage(page) {
        const filtered = this.getFilteredMembers();
        const totalPages = Math.ceil(filtered.length / this.pageSize);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
        document.querySelector('.members-table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showAddMember() {
        const form = this.createMemberForm();
        const modal = UI.createModal('Add New Member', form, () => {
            this.render();
        });

        // Set up form submission
        const formElement = modal.querySelector('#memberForm');
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMember(formElement);
            modal.remove();
        });

        // Set up plan price changes
        const planSelect = formElement.querySelector('#plan');
        const priceInput = formElement.querySelector('#price');
        planSelect.addEventListener('change', () => {
            const price = this.getPlanPrice(planSelect.value);
            priceInput.value = price;
        });
    }

    createMemberForm(member = null) {
        const isEdit = !!member;
        const products = ['Doujinshi', 'Manhwa'];
        const plans = ['1 Month', '3 Months', '6 Months', '9 Months', '12 Months', 'Lifetime'];
        const payments = ['KPay', 'Wave Pay', 'Aya Pay'];

        return `
            <form id="memberForm" class="member-form">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" required 
                           value="${member?.username || ''}" placeholder="Enter username" />
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="product">Product *</label>
                        <select id="product" name="product" required>
                            <option value="">Select Product</option>
                            ${products.map(p => `
                                <option value="${p}" ${member?.product === p ? 'selected' : ''}>${p}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="plan">Subscription Plan *</label>
                        <select id="plan" name="plan" required>
                            <option value="">Select Plan</option>
                            ${plans.map(p => `
                                <option value="${p}" ${member?.plan === p ? 'selected' : ''}>${p}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="price">Price (Ks) *</label>
                        <input type="number" id="price" name="price" required 
                               value="${member?.price || ''}" placeholder="0" />
                    </div>

                    <div class="form-group">
                        <label for="paymentMethod">Payment Method *</label>
                        <select id="paymentMethod" name="paymentMethod" required>
                            <option value="">Select Payment</option>
                            ${payments.map(p => `
                                <option value="${p}" ${member?.paymentMethod === p ? 'selected' : ''}>${p}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="purchaseDate">Purchase Date *</label>
                        <input type="date" id="purchaseDate" name="purchaseDate" required 
                               value="${member?.purchaseDate || new Date().toISOString().split('T')[0]}" />
                    </div>

                    <div class="form-group">
                        <label for="expiryDate">Expiry Date *</label>
                        <input type="date" id="expiryDate" name="expiryDate" required 
                               value="${member?.expiryDate || ''}" />
                    </div>
                </div>

                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Additional notes...">${member?.notes || ''}</textarea>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update Member' : 'Add Member'}</button>
                </div>
            </form>
        `;
    }

    saveMember(form) {
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            product: formData.get('product'),
            plan: formData.get('plan'),
            price: parseFloat(formData.get('price')),
            paymentMethod: formData.get('paymentMethod'),
            purchaseDate: formData.get('purchaseDate'),
            expiryDate: formData.get('expiryDate'),
            notes: formData.get('notes') || ''
        };

        // Validation
        if (!data.username || !data.product || !data.plan || !data.price || !data.paymentMethod) {
            UI.toast('Please fill in all required fields', 'error');
            return;
        }

        // Check for duplicate username
        const existing = this.members.find(m => 
            m.username.toLowerCase() === data.username.toLowerCase() && 
            m.id !== (this.selectedMemberId || '')
        );
        if (existing) {
            UI.toast('A member with this username already exists', 'error');
            return;
        }

        if (this.selectedMemberId) {
            // Update existing member
            const updated = storage.updateMember(this.selectedMemberId, data);
            if (updated) {
                UI.toast('Member updated successfully!', 'success');
                this.members = storage.getMembers();
                this.selectedMemberId = null;
                this.render();
            }
        } else {
            // Add new member
            const member = storage.addMember(data);
            
            // Add transaction
            storage.addTransaction({
                memberId: member.id,
                username: member.username,
                product: member.product,
                plan: member.plan,
                amount: member.price,
                paymentMethod: member.paymentMethod,
                purchaseDate: member.purchaseDate,
                expiryDate: member.expiryDate,
                type: 'purchase'
            });
            
            UI.toast('Member added successfully!', 'success');
            this.members = storage.getMembers();
            this.transactions = storage.getTransactions();
            this.render();
        }
    }

    showMemberProfile(id) {
        this.selectedMemberId = id;
        const member = storage.getMember(id);
        if (!member) {
            UI.toast('Member not found', 'error');
            return;
        }

        const transactions = storage.getMemberTransactions(id);
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const status = UI.getExpiryStatus(member.expiryDate);

        const content = `
            <div class="member-profile">
                <div class="profile-header">
                    <div class="profile-avatar">${member.username.charAt(0).toUpperCase()}</div>
                    <div class="profile-info">
                        <h2>${member.username}</h2>
                        <div class="profile-meta">
                            <span class="product-badge ${member.product.toLowerCase()}">${member.product}</span>
                            <span class="status-badge status-${status.type}">${status.label}</span>
                        </div>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Plan</label>
                            <span>${member.plan}</span>
                        </div>
                        <div class="detail-item">
                            <label>Price</label>
                            <span>${UI.formatCurrency(member.price)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Payment</label>
                            <span class="payment-badge ${member.paymentMethod?.toLowerCase().replace(' ', '') || ''}">${member.paymentMethod}</span>
                        </div>
                        <div class="detail-item">
                            <label>Purchase Date</label>
                            <span>${UI.formatDate(member.purchaseDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Expiry Date</label>
                            <span>${UI.formatDate(member.expiryDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Revenue</label>
                            <span>${UI.formatCurrency(totalRevenue)}</span>
                        </div>
                    </div>
                    ${member.notes ? `
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <label>Notes</label>
                            <span>${member.notes}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.members.renewMember('${member.id}')">🔄 Renew</button>
                    <button class="btn btn-secondary" onclick="app.members.editMember('${member.id}')">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="app.members.deleteMember('${member.id}')">🗑️ Delete</button>
                </div>

                ${transactions.length > 0 ? `
                    <div class="profile-transactions">
                        <h4>Transaction History</h4>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${transactions.map(t => `
                                    <tr>
                                        <td>${UI.formatDateTime(t.createdAt)}</td>
                                        <td>${t.plan}</td>
                                        <td>${UI.formatCurrency(t.amount)}</td>
                                        <td><span class="payment-badge ${t.paymentMethod?.toLowerCase().replace(' ', '') || ''}">${t.paymentMethod}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;

        UI.createModal('Member Profile', content);
    }

    editMember(id) {
        const member = storage.getMember(id);
        if (!member) return;

        const form = this.createMemberForm(member);
        const modal = UI.createModal('Edit Member', form, () => {
            this.selectedMemberId = null;
            this.render();
        });

        const formElement = modal.querySelector('#memberForm');
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.selectedMemberId = id;
            this.saveMember(formElement);
            modal.remove();
        });

        // Set up plan price changes
        const planSelect = formElement.querySelector('#plan');
        const priceInput = formElement.querySelector('#price');
        planSelect.addEventListener('change', () => {
            const price = this.getPlanPrice(planSelect.value);
            priceInput.value = price;
        });
    }

    renewMember(id) {
        const member = storage.getMember(id);
        if (!member) return;

        // Create renewal form
        const form = `
            <form id="renewalForm" class="member-form">
                <p>Renew membership for <strong>${member.username}</strong></p>
                <div class="form-group">
                    <label for="renewalPlan">New Plan</label>
                    <select id="renewalPlan" name="plan" required>
                        <option value="${member.plan}">${member.plan} (Current)</option>
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                        <option value="9 Months">9 Months</option>
                        <option value="12 Months">12 Months</option>
                        <option value="Lifetime">Lifetime</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="renewalPayment">Payment Method</label>
                    <select id="renewalPayment" name="paymentMethod" required>
                        <option value="${member.paymentMethod}">${member.paymentMethod} (Previous)</option>
                        <option value="KPay">KPay</option>
                        <option value="Wave Pay">Wave Pay</option>
                        <option value="Aya Pay">Aya Pay</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Renew</button>
                </div>
            </form>
        `;

        const modal = UI.createModal('Renew Membership', form, () => {
            this.render();
        });

        const formElement = modal.querySelector('#renewalForm');
        formElement.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(formElement);
            const plan = formData.get('plan');
            const paymentMethod = formData.get('paymentMethod');
            const price = this.getPlanPrice(plan);
            
            // Calculate new expiry date
            const currentExpiry = new Date(member.expiryDate);
            const now = new Date();
            const startDate = currentExpiry > now ? currentExpiry : now;
            const expiryDate = this.calculateExpiryDate(startDate, plan);

            // Update member
            storage.updateMember(id, {
                plan: plan,
                price: price,
                paymentMethod: paymentMethod,
                expiryDate: expiryDate.toISOString().split('T')[0],
                purchaseDate: now.toISOString().split('T')[0]
            });

            // Add transaction
            storage.addTransaction({
                memberId: id,
                username: member.username,
                product: member.product,
                plan: plan,
                amount: price,
                paymentMethod: paymentMethod,
                purchaseDate: now.toISOString().split('T')[0],
                expiryDate: expiryDate.toISOString().split('T')[0],
                type: 'renewal'
            });

            UI.toast(`Renewed ${member.username} successfully!`, 'success');
            this.members = storage.getMembers();
            this.transactions = storage.getTransactions();
            modal.remove();
            this.render();
        });
    }

    deleteMember(id) {
        const member = storage.getMember(id);
        if (!member) return;

        if (confirm(`Are you sure you want to delete "${member.username}"? This cannot be undone.`)) {
            storage.deleteMember(id);
            UI.toast(`Deleted ${member.username}`, 'warning');
            this.members = storage.getMembers();
            this.transactions = storage.getTransactions();
            this.render();
        }
    }

    getPlanPrice(plan) {
        const prices = {
            '1 Month': 5000,
            '3 Months': 12000,
            '6 Months': 24000,
            '9 Months': 36000,
            '12 Months': 48000,
            'Lifetime': 55000
        };
        return prices[plan] || 0;
    }

    calculateExpiryDate(startDate, plan) {
        const date = new Date(startDate);
        switch(plan) {
            case '1 Month': date.setMonth(date.getMonth() + 1); break;
            case '3 Months': date.setMonth(date.getMonth() + 3); break;
            case '6 Months': date.setMonth(date.getMonth() + 6); break;
            case '9 Months': date.setMonth(date.getMonth() + 9); break;
            case '12 Months': date.setFullYear(date.getFullYear() + 1); break;
            case 'Lifetime': date.setFullYear(date.getFullYear() + 99); break;
            default: date.setMonth(date.getMonth() + 1);
        }
        return date;
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('memberSearch');
        if (searchInput) {
            searchInput.addEventListener('input', UI.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.renderTable();
                this.renderPagination();
            }, 300));
        }

        // Filters
        ['filterProduct', 'filterPlan', 'filterPayment', 'filterStatus'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => {
                    const filterMap = {
                        'filterProduct': 'product',
                        'filterPlan': 'plan',
                        'filterPayment': 'payment',
                        'filterStatus': 'status'
                    };
                    this.filters[filterMap[id]] = e.target.value;
                    this.currentPage = 1;
                    this.renderTable();
                    this.renderPagination();
                    this.renderStats();
                });
            }
        });

        // Sort
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderTable();
            });
        }
    }
}