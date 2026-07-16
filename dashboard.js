/**
 * ========================================
 * Dashboard Module
 * Displays key metrics and overview
 * ========================================
 */

class Dashboard {
    constructor(container) {
        this.container = container;
        this.data = storage.data;
        this.members = storage.getMembers();
        this.transactions = storage.getTransactions();
        this.currentDate = new Date();
        this.dateRange = 'today'; // today, week, month
    }

    render() {
        this.container.innerHTML = `
            <div class="dashboard-page">
                <!-- Stats Grid -->
                <div class="stats-grid" id="statsGrid">
                    ${this.renderStats()}
                </div>

                <!-- Main Grid -->
                <div class="dashboard-grid">
                    <!-- Revenue Chart -->
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Revenue Overview</h3>
                            <div class="date-range-selector">
                                <button class="range-btn active" data-range="today">Today</button>
                                <button class="range-btn" data-range="week">Week</button>
                                <button class="range-btn" data-range="month">Month</button>
                            </div>
                        </div>
                        <div class="chart-container" id="revenueChart">
                            <canvas id="revenueCanvas"></canvas>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Payment Summary</h3>
                        </div>
                        <div class="payment-summary-grid">
                            ${this.renderPaymentSummary()}
                        </div>
                    </div>
                </div>

                <!-- Second Grid Row -->
                <div class="dashboard-grid">
                    <!-- Recent Transactions -->
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Recent Transactions</h3>
                            <button class="card-action" onclick="app.navigateTo('members')">View All</button>
                        </div>
                        <div class="transaction-list" id="recentTransactions">
                            ${this.renderRecentTransactions()}
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="dashboard-card">
                        <div class="card-header">
                            <h3 class="card-title">Quick Stats</h3>
                        </div>
                        <div id="quickStats">
                            ${this.renderQuickStats()}
                        </div>
                    </div>
                </div>

                <!-- Expiry Alerts -->
                <div class="dashboard-card" style="margin-top: var(--spacing-lg);">
                    <div class="card-header">
                        <h3 class="card-title">⚠️ Expiry Alerts</h3>
                    </div>
                    <div id="expiryAlerts">
                        ${this.renderExpiryAlerts()}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.initializeChart();
    }

    renderStats() {
        const stats = this.calculateStats();
        return `
            <div class="stat-card glass">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${UI.formatCurrency(stats.totalRevenue)}</div>
                <div class="stat-change ${stats.revenueChange >= 0 ? 'positive' : 'negative'}">
                    ${stats.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.revenueChange).toFixed(1)}%
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Today's Revenue</div>
                <div class="stat-value">${UI.formatCurrency(stats.todayRevenue)}</div>
                <div class="stat-change ${stats.todayChange >= 0 ? 'positive' : 'negative'}">
                    ${stats.todayChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.todayChange).toFixed(1)}%
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Monthly Revenue</div>
                <div class="stat-value">${UI.formatCurrency(stats.monthlyRevenue)}</div>
                <div class="stat-change ${stats.monthlyChange >= 0 ? 'positive' : 'negative'}">
                    ${stats.monthlyChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.monthlyChange).toFixed(1)}%
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${stats.totalMembers}</div>
                <div class="stat-change ${stats.memberChange >= 0 ? 'positive' : 'negative'}">
                    ${stats.memberChange >= 0 ? '↑' : '↓'} ${Math.abs(stats.memberChange).toFixed(1)}%
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Doujinshi Members</div>
                <div class="stat-value">${stats.doujinshiCount}</div>
                <div class="stat-change neutral">${((stats.doujinshiCount / stats.totalMembers) * 100 || 0).toFixed(1)}%</div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Manhwa Members</div>
                <div class="stat-value">${stats.manhwaCount}</div>
                <div class="stat-change neutral">${((stats.manhwaCount / stats.totalMembers) * 100 || 0).toFixed(1)}%</div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Lifetime Members</div>
                <div class="stat-value">${stats.lifetimeCount}</div>
                <div class="stat-change neutral">${((stats.lifetimeCount / stats.totalMembers) * 100 || 0).toFixed(1)}%</div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Active Members</div>
                <div class="stat-value">${stats.activeMembers}</div>
                <div class="stat-change ${stats.activeRate >= 70 ? 'positive' : 'neutral'}">
                    ${stats.activeRate.toFixed(1)}% Active
                </div>
            </div>
        `;
    }

    calculateStats() {
        const members = this.members;
        const transactions = this.transactions;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Total Revenue
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Today's Revenue
        const todayRevenue = transactions
            .filter(t => new Date(t.createdAt) >= today)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Monthly Revenue
        const monthlyRevenue = transactions
            .filter(t => new Date(t.createdAt) >= monthStart)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Member counts
        const totalMembers = members.length;
        const doujinshiCount = members.filter(m => m.product === 'Doujinshi').length;
        const manhwaCount = members.filter(m => m.product === 'Manhwa').length;
        const lifetimeCount = members.filter(m => m.plan === 'Lifetime').length;
        
        // Active members (not expired)
        const activeMembers = members.filter(m => {
            if (!m.expiryDate) return false;
            return new Date(m.expiryDate) >= now;
        }).length;
        
        // Calculate percentage changes (simplified)
        const lastMonthRevenue = this.getLastMonthRevenue();
        const revenueChange = lastMonthRevenue ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        
        const lastMonthMembers = this.getLastMonthMembers();
        const memberChange = lastMonthMembers ? ((totalMembers - lastMonthMembers) / lastMonthMembers) * 100 : 0;
        
        // Today's revenue change (compared to yesterday)
        const yesterdayRevenue = this.getYesterdayRevenue();
        const todayChange = yesterdayRevenue ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
        
        return {
            totalRevenue,
            todayRevenue,
            monthlyRevenue,
            totalMembers,
            doujinshiCount,
            manhwaCount,
            lifetimeCount,
            activeMembers,
            activeRate: totalMembers ? (activeMembers / totalMembers) * 100 : 0,
            revenueChange,
            memberChange,
            todayChange,
            monthlyChange: revenueChange
        };
    }

    getLastMonthRevenue() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        return this.transactions
            .filter(t => {
                const date = new Date(t.createdAt);
                return date >= lastMonth && date <= lastMonthEnd;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    getLastMonthMembers() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        return this.members
            .filter(m => {
                const date = new Date(m.createdAt);
                return date >= lastMonth && date <= lastMonthEnd;
            }).length;
    }

    getYesterdayRevenue() {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return this.transactions
            .filter(t => {
                const date = new Date(t.createdAt);
                return date >= yesterdayStart && date < yesterdayEnd;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    renderPaymentSummary() {
        const payments = this.transactions.reduce((acc, t) => {
            const method = t.paymentMethod || 'Unknown';
            if (!acc[method]) acc[method] = { amount: 0, count: 0 };
            acc[method].amount += t.amount || 0;
            acc[method].count += 1;
            return acc;
        }, {});

        const methods = {
            'KPay': { color: 'kpay', icon: '💳' },
            'Wave Pay': { color: 'wave', icon: '📱' },
            'Aya Pay': { color: 'aya', icon: '🏦' }
        };

        let html = '';
        for (const [method, data] of Object.entries(payments)) {
            const info = methods[method] || { color: 'default', icon: '💰' };
            html += `
                <div class="payment-item ${info.color}">
                    <div class="label">${info.icon} ${method}</div>
                    <div class="amount">${UI.formatCurrency(data.amount)}</div>
                    <div class="count">${data.count} transactions</div>
                </div>
            `;
        }

        // If no payments, show placeholder
        if (!html) {
            html = `
                <div class="payment-item" style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">
                    No payments recorded yet
                </div>
            `;
        }

        return html;
    }

    renderRecentTransactions() {
        const recent = this.transactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        if (recent.length === 0) {
            return `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    No transactions yet
                </div>
            `;
        }

        let html = '';
        recent.forEach(t => {
            const member = storage.getMember(t.memberId);
            const name = member ? member.username : 'Unknown Member';
            const initial = name.charAt(0).toUpperCase();
            const status = UI.getExpiryStatus(t.expiryDate || new Date());
            
            html += `
                <div class="transaction-item" onclick="app.navigateTo('members'); storage.selectMember('${t.memberId}')">
                    <div class="transaction-info">
                        <div class="transaction-avatar">${initial}</div>
                        <div class="transaction-details">
                            <div class="name">${name}</div>
                            <div class="product">${t.product || 'N/A'} • ${t.plan || 'N/A'} • ${UI.formatDate(t.createdAt)}</div>
                        </div>
                    </div>
                    <div class="transaction-amount positive">${UI.formatCurrency(t.amount || 0)}</div>
                </div>
            `;
        });

        return html;
    }

    renderQuickStats() {
        const members = this.members;
        const planCounts = members.reduce((acc, m) => {
            const plan = m.plan || 'Unknown';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
        }, {});

        const plans = [
            '1 Month', '3 Months', '6 Months', '9 Months', '12 Months', 'Lifetime'
        ];

        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">';
        plans.forEach(plan => {
            const count = planCounts[plan] || 0;
            const revenue = this.transactions
                .filter(t => t.plan === plan)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            html += `
                <div style="padding: var(--spacing-sm); background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                    <div style="font-weight: 500; font-size: var(--font-size-xs); color: var(--text-secondary);">${plan}</div>
                    <div style="font-weight: 600;">${count} members</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${UI.formatCurrency(revenue)}</div>
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    renderExpiryAlerts() {
        const members = this.members;
        const now = new Date();
        const sevenDays = new Date(now);
        sevenDays.setDate(sevenDays.getDate() + 7);

        const expiring = members.filter(m => {
            if (!m.expiryDate) return false;
            const expiry = new Date(m.expiryDate);
            return expiry >= now && expiry <= sevenDays;
        });

        const expired = members.filter(m => {
            if (!m.expiryDate) return false;
            return new Date(m.expiryDate) < now;
        });

        if (expiring.length === 0 && expired.length === 0) {
            return `
                <div style="text-align: center; padding: var(--spacing-md); color: var(--success);">
                    ✅ All memberships are active and up to date
                </div>
            `;
        }

        let html = '<div style="display: grid; gap: var(--spacing-sm);">';
        
        // Expired members
        expired.forEach(m => {
            const days = Math.floor((now - new Date(m.expiryDate)) / (1000 * 60 * 60 * 24));
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm); background: rgba(255, 59, 48, 0.1); border-radius: var(--radius-sm); border-left: 4px solid var(--danger);">
                    <div>
                        <strong>${m.username}</strong>
                        <span style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-left: var(--spacing-sm);">
                            ${m.product} • ${m.plan}
                        </span>
                    </div>
                    <div>
                        <span style="color: var(--danger); font-weight: 600;">Expired ${days} days ago</span>
                        <button class="btn btn-sm btn-primary" onclick="app.members.renewMember('${m.id}')" style="margin-left: var(--spacing-sm);">
                            Renew
                        </button>
                    </div>
                </div>
            `;
        });

        // Expiring soon
        expiring.forEach(m => {
            const days = Math.ceil((new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24));
            let status = 'info';
            let label = `Expires in ${days} days`;
            if (days <= 3) { status = 'warning'; label = `⚠️ Expires in ${days} days`; }
            if (days === 0) { status = 'danger'; label = '⚠️ Expires Today!'; }
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm); background: rgba(255, 149, 0, 0.1); border-radius: var(--radius-sm); border-left: 4px solid var(--warning);">
                    <div>
                        <strong>${m.username}</strong>
                        <span style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-left: var(--spacing-sm);">
                            ${m.product} • ${m.plan}
                        </span>
                    </div>
                    <div>
                        <span style="color: var(--warning); font-weight: 600;">${label}</span>
                        <button class="btn btn-sm btn-primary" onclick="app.members.renewMember('${m.id}')" style="margin-left: var(--spacing-sm);">
                            Renew
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    initializeChart() {
        const canvas = document.getElementById('revenueCanvas');
        if (!canvas) return;

        // Simple chart implementation using canvas
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40;
        canvas.height = 200;

        // Get data based on selected range
        const range = document.querySelector('.range-btn.active')?.dataset.range || 'today';
        const data = this.getChartData(range);

        this.drawChart(ctx, canvas.width, canvas.height, data);
    }

    getChartData(range) {
        const now = new Date();
        let data = [];
        let labels = [];

        if (range === 'today') {
            // Hourly data for today
            for (let i = 0; i < 24; i++) {
                const hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i);
                const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i + 1);
                const revenue = this.transactions
                    .filter(t => {
                        const date = new Date(t.createdAt);
                        return date >= hour && date < nextHour;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                data.push(revenue);
                labels.push(`${i}:00`);
            }
        } else if (range === 'week') {
            // Daily data for last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                const revenue = this.transactions
                    .filter(t => {
                        const d = new Date(t.createdAt);
                        return d >= start && d < end;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                data.push(revenue);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            }
        } else {
            // Monthly data for last 12 months
            for (let i = 11; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                const revenue = this.transactions
                    .filter(t => {
                        const d = new Date(t.createdAt);
                        return d >= month && d < nextMonth;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                data.push(revenue);
                labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
            }
        }

        return { data, labels };
    }

    drawChart(ctx, width, height, { data, labels }) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...data, 1000);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw bars or line
        const barWidth = Math.min(chartWidth / data.length * 0.7, 30);
        const gap = chartWidth / data.length;

        // Gradient
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(0, 122, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 122, 255, 0.1)');

        // Draw bars
        data.forEach((value, index) => {
            const x = padding + index * gap + (gap - barWidth) / 2;
            const barHeight = (value / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;

            // Bar
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();

            // Value on top
            if (value > 0) {
                ctx.fillStyle = 'var(--text-secondary)';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(UI.formatCurrency(value), x + barWidth / 2, y - 5);
            }

            // Label
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth / 2, height - 10);
        });

        // Draw average line
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 0) {
            const avgY = padding + chartHeight - (avg / maxValue) * chartHeight;
            ctx.strokeStyle = 'rgba(255, 149, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding, avgY);
            ctx.lineTo(width - padding, avgY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Average label
            ctx.fillStyle = 'rgba(255, 149, 0, 0.7)';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Avg: ' + UI.formatCurrency(avg), width - padding - 80, avgY - 5);
        }
    }

    bindEvents() {
        // Date range buttons
        document.querySelectorAll('.range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.initializeChart();
            });
        });
    }
}

// Polyfill for roundRect if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}