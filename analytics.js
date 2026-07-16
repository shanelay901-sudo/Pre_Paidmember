/**
 * ========================================
 * Analytics Module
 * Displays charts and data insights
 * ========================================
 */

class Analytics {
    constructor(container) {
        this.container = container;
        this.members = storage.getMembers();
        this.transactions = storage.getTransactions();
        this.currentPeriod = 'monthly'; // daily, monthly, yearly
    }

    render() {
        this.container.innerHTML = `
            <div class="analytics-page">
                <div class="page-header">
                    <h1>Analytics Dashboard</h1>
                    <div class="period-selector">
                        <button class="period-btn active" data-period="daily">Daily</button>
                        <button class="period-btn" data-period="monthly">Monthly</button>
                        <button class="period-btn" data-period="yearly">Yearly</button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="stats-grid" id="analyticsStats">
                    ${this.renderStats()}
                </div>

                <!-- Charts Grid -->
                <div class="analytics-grid">
                    <!-- Revenue Chart -->
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3 class="card-title">Revenue Trends</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="revenueTrendChart"></canvas>
                        </div>
                    </div>

                    <!-- Product Distribution -->
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3 class="card-title">Product Distribution</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="productDistributionChart"></canvas>
                        </div>
                    </div>

                    <!-- Payment Distribution -->
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3 class="card-title">Payment Methods</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="paymentDistributionChart"></canvas>
                        </div>
                    </div>

                    <!-- Subscription Distribution -->
                    <div class="dashboard-card chart-card">
                        <div class="card-header">
                            <h3 class="card-title">Subscription Plans</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="subscriptionDistributionChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detailed Statistics -->
                <div class="dashboard-card" style="margin-top: var(--spacing-lg);">
                    <div class="card-header">
                        <h3 class="card-title">Detailed Statistics</h3>
                    </div>
                    <div id="detailedStats">
                        ${this.renderDetailedStats()}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.initializeCharts();
    }

    renderStats() {
        const totalRevenue = this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalMembers = this.members.length;
        const avgRevenue = totalMembers ? totalRevenue / totalMembers : 0;
        const activeMembers = this.members.filter(m => {
            if (!m.expiryDate) return false;
            return new Date(m.expiryDate) >= new Date();
        }).length;
        const renewalRate = totalMembers ? ((this.transactions.filter(t => t.type === 'renewal').length / totalMembers) * 100) : 0;

        // Calculate growth
        const lastMonthRevenue = this.getPeriodRevenue('monthly', 1);
        const growth = lastMonthRevenue ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        return `
            <div class="stat-card glass">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">${UI.formatCurrency(totalRevenue)}</div>
                <div class="stat-change ${growth >= 0 ? 'positive' : 'negative'}">
                    ${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}% from last month
                </div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${totalMembers}</div>
                <div class="stat-change neutral">${activeMembers} active (${((activeMembers/totalMembers)*100 || 0).toFixed(1)}%)</div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Average Revenue per Member</div>
                <div class="stat-value">${UI.formatCurrency(avgRevenue)}</div>
                <div class="stat-change neutral">${renewalRate.toFixed(1)}% renewal rate</div>
            </div>
            <div class="stat-card glass">
                <div class="stat-label">Total Transactions</div>
                <div class="stat-value">${this.transactions.length}</div>
                <div class="stat-change neutral">${this.transactions.filter(t => t.type === 'purchase').length} new, ${this.transactions.filter(t => t.type === 'renewal').length} renewals</div>
            </div>
        `;
    }

    renderDetailedStats() {
        // Product breakdown
        const productData = this.members.reduce((acc, m) => {
            const product = m.product || 'Unknown';
            if (!acc[product]) acc[product] = { count: 0, revenue: 0 };
            acc[product].count++;
            const revenue = this.transactions
                .filter(t => t.memberId === m.id)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            acc[product].revenue += revenue;
            return acc;
        }, {});

        // Payment breakdown
        const paymentData = this.transactions.reduce((acc, t) => {
            const method = t.paymentMethod || 'Unknown';
            if (!acc[method]) acc[method] = { count: 0, amount: 0 };
            acc[method].count++;
            acc[method].amount += t.amount || 0;
            return acc;
        }, {});

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg);">
                <div>
                    <h4 style="margin-bottom: var(--spacing-md);">Product Breakdown</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Members</th>
                                <th>Revenue</th>
                                <th>Avg/ Member</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        for (const [product, data] of Object.entries(productData)) {
            const avg = data.count ? data.revenue / data.count : 0;
            html += `
                <tr>
                    <td><span class="product-badge ${product.toLowerCase()}">${product}</span></td>
                    <td>${data.count}</td>
                    <td>${UI.formatCurrency(data.revenue)}</td>
                    <td>${UI.formatCurrency(avg)}</td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
                <div>
                    <h4 style="margin-bottom: var(--spacing-md);">Payment Breakdown</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Transactions</th>
                                <th>Amount</th>
                                <th>Average</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        for (const [method, data] of Object.entries(paymentData)) {
            const avg = data.count ? data.amount / data.count : 0;
            const color = method.toLowerCase().replace(' ', '');
            html += `
                <tr>
                    <td><span class="payment-badge ${color}">${method}</span></td>
                    <td>${data.count}</td>
                    <td>${UI.formatCurrency(data.amount)}</td>
                    <td>${UI.formatCurrency(avg)}</td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        return html;
    }

    initializeCharts() {
        this.renderRevenueChart();
        this.renderProductChart();
        this.renderPaymentChart();
        this.renderSubscriptionChart();
    }

    renderRevenueChart() {
        const canvas = document.getElementById('revenueTrendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40;
        canvas.height = 250;

        const data = this.getRevenueData();
        this.drawLineChart(ctx, canvas.width, canvas.height, data);
    }

    getRevenueData() {
        const now = new Date();
        const data = [];
        const labels = [];

        if (this.currentPeriod === 'daily') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
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
                labels.push(date.getDate().toString());
            }
        } else if (this.currentPeriod === 'monthly') {
            // Last 12 months
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
        } else {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = now.getFullYear() - i;
                const start = new Date(year, 0, 1);
                const end = new Date(year + 1, 0, 1);
                const revenue = this.transactions
                    .filter(t => {
                        const d = new Date(t.createdAt);
                        return d >= start && d < end;
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                data.push(revenue);
                labels.push(year.toString());
            }
        }

        return { data, labels };
    }

    drawLineChart(ctx, width, height, { data, labels }) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...data, 1000);

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxValue - (maxValue / 5) * i;
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(UI.formatCurrency(value), padding - 5, y + 3);
        }

        // Draw line
        if (data.length > 1) {
            const step = chartWidth / (data.length - 1);

            // Area fill
            const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
            gradient.addColorStop(0, 'rgba(0, 122, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 122, 255, 0.0)');

            ctx.beginPath();
            data.forEach((value, index) => {
                const x = padding + index * step;
                const y = padding + chartHeight - (value / maxValue) * chartHeight;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.lineTo(padding + (data.length - 1) * step, padding + chartHeight);
            ctx.lineTo(padding, padding + chartHeight);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Line
            ctx.beginPath();
            data.forEach((value, index) => {
                const x = padding + index * step;
                const y = padding + chartHeight - (value / maxValue) * chartHeight;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = '#007AFF';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Points
            data.forEach((value, index) => {
                const x = padding + index * step;
                const y = padding + chartHeight - (value / maxValue) * chartHeight;

                // Point circle
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#007AFF';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();

                // X-axis labels
                ctx.fillStyle = 'var(--text-secondary)';
                ctx.font = '9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(labels[index], x, height - 10);
            });
        }
    }

    renderProductChart() {
        const canvas = document.getElementById('productDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40;
        canvas.height = 200;

        const data = this.members.reduce((acc, m) => {
            const product = m.product || 'Unknown';
            acc[product] = (acc[product] || 0) + 1;
            return acc;
        }, {});

        const colors = ['#007AFF', '#FF9500', '#34C759'];
        const entries = Object.entries(data);
        const total = entries.reduce((sum, [_, count]) => sum + count, 0);

        this.drawPieChart(ctx, canvas.width, canvas.height, entries, colors, total);
    }

    renderPaymentChart() {
        const canvas = document.getElementById('paymentDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40;
        canvas.height = 200;

        const data = this.transactions.reduce((acc, t) => {
            const method = t.paymentMethod || 'Unknown';
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {});

        const colors = ['#007AFF', '#FFCC00', '#FF3B30', '#34C759'];
        const entries = Object.entries(data);
        const total = entries.reduce((sum, [_, count]) => sum + count, 0);

        this.drawPieChart(ctx, canvas.width, canvas.height, entries, colors, total);
    }

    renderSubscriptionChart() {
        const canvas = document.getElementById('subscriptionDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 40;
        canvas.height = 200;

        const data = this.members.reduce((acc, m) => {
            const plan = m.plan || 'Unknown';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
        }, {});

        const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA'];
        const entries = Object.entries(data);
        const total = entries.reduce((sum, [_, count]) => sum + count, 0);

        this.drawPieChart(ctx, canvas.width, canvas.height, entries, colors, total);
    }

    drawPieChart(ctx, width, height, data, colors, total) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        ctx.clearRect(0, 0, width, height);

        let startAngle = -Math.PI / 2;

        data.forEach(([label, count], index) => {
            const sliceAngle = (count / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();

            // Draw label
            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius * 0.6;
            const x = centerX + Math.cos(midAngle) * labelRadius;
            const y = centerY + Math.sin(midAngle) * labelRadius;

            if (sliceAngle > 0.3) {
                ctx.fillStyle = 'white';
                ctx.font = '10px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const percent = ((count / total) * 100).toFixed(1);
                ctx.fillText(`${percent}%`, x, y);
            }

            startAngle = endAngle;
        });

        // Legend
        let legendX = 20;
        const legendY = height - 20;
        ctx.textBaseline = 'bottom';

        data.forEach(([label, count], index) => {
            const percent = ((count / total) * 100).toFixed(1);
            const text = `${label} (${percent}%)`;
            
            // Color box
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(legendX, legendY - 8, 10, 10);
            
            // Label
            ctx.fillStyle = 'var(--text-secondary)';
            ctx.font = '9px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(text, legendX + 14, legendY + 2);
            
            legendX += ctx.measureText(text).width + 30;
        });
    }

    getPeriodRevenue(period, offset = 0) {
        const now = new Date();
        let start, end;

        if (period === 'daily') {
            start = new Date(now);
            start.setDate(start.getDate() - offset);
            start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            end = new Date(start);
            end.setDate(end.getDate() + 1);
        } else if (period === 'monthly') {
            start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
        } else {
            start = new Date(now.getFullYear() - offset, 0, 1);
            end = new Date(now.getFullYear() - offset + 1, 0, 1);
        }

        return this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d >= start && d < end;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    bindEvents() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.renderRevenueChart();
            });
        });
    }
}