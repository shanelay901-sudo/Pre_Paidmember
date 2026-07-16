// ========================================
// REPORTS - WITH PAYMENT BREAKDOWN
// ========================================
class Reports {
    constructor(container) {
        this.container = container;
        this.transactions = storage.getTransactions();
        this.members = storage.getMembers();
        this.reportDate = new Date();
        this.reportType = 'daily';
    }

    render() {
        this.container.innerHTML = `
            <div class="dashboard-page">
                <h1 style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:var(--spacing-lg);">Reports</h1>

                <div style="display:flex;gap:var(--spacing-xs);margin-bottom:var(--spacing-lg);background:var(--bg-tertiary);padding:4px;border-radius:var(--radius-full);width:fit-content;">
                    <button class="btn ${this.reportType === 'daily' ? 'btn-primary' : 'btn-secondary'}" onclick="app.reports.setType('daily')">📊 Daily</button>
                    <button class="btn ${this.reportType === 'monthly' ? 'btn-primary' : 'btn-secondary'}" onclick="app.reports.setType('monthly')">📈 Monthly</button>
                </div>

                ${this.reportType === 'daily' ? this.renderDaily() : this.renderMonthly()}
            </div>
        `;
    }

    setType(type) {
        this.reportType = type;
        this.render();
    }

    renderDaily() {
        const date = this.reportDate;
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dailyTransactions = this.transactions.filter(t => {
            const d = new Date(t.createdAt);
            return d >= start && d < end;
        });

        const revenue = dailyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const count = dailyTransactions.length;

        // Payment Breakdown
        const paymentBreakdown = dailyTransactions.reduce((acc, t) => {
            const method = t.paymentMethod || 'Unknown';
            if (!acc[method]) acc[method] = { count: 0, revenue: 0 };
            acc[method].count++;
            acc[method].revenue += t.amount || 0;
            return acc;
        }, {});

        // Product Breakdown
        const productBreakdown = dailyTransactions.reduce((acc, t) => {
            const product = t.product || 'Unknown';
            if (!acc[product]) acc[product] = { count: 0, revenue: 0 };
            acc[product].count++;
            acc[product].revenue += t.amount || 0;
            return acc;
        }, {});

        const paymentColors = {
            'KPay': { bg: 'rgba(0,122,255,0.15)', color: '#007AFF', icon: '💳' },
            'Wave Pay': { bg: 'rgba(255,204,0,0.15)', color: '#B8860B', icon: '📱' },
            'Aya Pay': { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30', icon: '🏦' }
        };

        return `
            <div style="background:var(--glass-bg);border-radius:var(--radius-lg);padding:var(--spacing-lg);border:1px solid var(--glass-border);backdrop-filter:blur(20px);">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--spacing-sm);margin-bottom:var(--spacing-lg);">
                    <h2>📊 ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
                    <div style="display:flex;gap:var(--spacing-sm);">
                        <input type="date" value="${date.toISOString().split('T')[0]}" 
                               onchange="app.reports.changeDate(this.value)" 
                               style="padding:8px 14px;border:1px solid var(--border-color);border-radius:var(--radius-full);background:var(--bg-secondary);font-family:var(--font-family);">
                        <button class="btn btn-primary" onclick="app.reports.exportPDF()">📄 PDF</button>
                        <button class="btn btn-success" onclick="app.reports.exportCSV()">📊 CSV</button>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--spacing-md);margin-bottom:var(--spacing-lg);">
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">💰 Revenue</div>
                        <div style="font-size:21px;font-weight:700;">${UI.formatCurrency(revenue)}</div>
                    </div>
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">📝 Transactions</div>
                        <div style="font-size:21px;font-weight:700;">${count}</div>
                    </div>
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">📊 Avg/Transaction</div>
                        <div style="font-size:21px;font-weight:700;">${count ? UI.formatCurrency(revenue / count) : UI.formatCurrency(0)}</div>
                    </div>
                </div>

                <!-- PAYMENT BREAKDOWN CARDS -->
                <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:var(--spacing-lg);margin-bottom:var(--spacing-lg);border:2px solid var(--primary);box-shadow:var(--shadow-hover);">
                    <h3 style="margin-bottom:var(--spacing-md);font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--primary);">
                        💳 Payment Breakdown
                        <span style="font-size:13px;font-weight:400;color:var(--text-secondary);margin-left:auto;">
                            ${Object.keys(paymentBreakdown).length} payment method(s)
                        </span>
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--spacing-md);">
                        ${Object.keys(paymentBreakdown).length === 0 ? `
                            <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:var(--spacing-xl);background:var(--bg-tertiary);border-radius:var(--radius-md);">
                                <div style="font-size:48px;margin-bottom:var(--spacing-sm);">💳</div>
                                <p style="font-size:15px;">No payments for this day</p>
                                <p style="font-size:12px;">Add members with different payment methods</p>
                            </div>
                        ` : Object.entries(paymentBreakdown).map(([method, data]) => {
                            const colors = paymentColors[method] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', icon: '💰' };
                            const percent = revenue > 0 ? ((data.revenue / revenue) * 100).toFixed(1) : 0;
                            return `
                                <div style="background:${colors.bg};padding:var(--spacing-lg);border-radius:var(--radius-md);text-align:center;border:2px solid ${colors.color}40;">
                                    <div style="font-size:36px;">${colors.icon}</div>
                                    <div style="font-weight:700;color:${colors.color};font-size:16px;margin-top:4px;">${method}</div>
                                    <div style="font-size:24px;font-weight:700;margin:8px 0;color:var(--text-primary);">${UI.formatCurrency(data.revenue)}</div>
                                    <div style="font-size:13px;color:var(--text-secondary);">${data.count} transaction${data.count > 1 ? 's' : ''}</div>
                                    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${percent}% of total</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- PRODUCT BREAKDOWN CARDS -->
                <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:var(--spacing-lg);margin-bottom:var(--spacing-lg);border:1px solid var(--border-color);">
                    <h3 style="margin-bottom:var(--spacing-md);font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;">
                        📦 Product Breakdown
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--spacing-md);">
                        ${Object.keys(productBreakdown).length === 0 ? `
                            <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:var(--spacing-md);">
                                No products for this day
                            </div>
                        ` : Object.entries(productBreakdown).map(([product, data]) => {
                            const productColors = {
                                'Doujinshi': { bg: 'rgba(88,86,214,0.15)', color: '#5856D6' },
                                'Manhwa': { bg: 'rgba(255,149,0,0.15)', color: '#FF9500' }
                            };
                            const colors = productColors[product] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
                            return `
                                <div style="background:${colors.bg};padding:var(--spacing-md);border-radius:var(--radius-md);text-align:center;border:2px solid ${colors.color}40;">
                                    <div style="font-weight:700;color:${colors.color};font-size:15px;">${product}</div>
                                    <div style="font-size:22px;font-weight:700;margin:6px 0;color:var(--text-primary);">${UI.formatCurrency(data.revenue)}</div>
                                    <div style="font-size:12px;color:var(--text-secondary);">${data.count} transaction${data.count > 1 ? 's' : ''}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Transaction List -->
                <div style="max-height:400px;overflow-y:auto;">
                    ${dailyTransactions.length === 0 ? `
                        <div style="text-align:center;padding:var(--spacing-xl);color:var(--text-secondary);">
                            No transactions for this day
                        </div>
                    ` : dailyTransactions.map(t => {
                        const member = storage.getMember(t.memberId);
                        const name = member ? member.username : 'Unknown';
                        return `
                            <div style="display:flex;justify-content:space-between;padding:var(--spacing-sm);border-bottom:1px solid var(--border-color);">
                                <div>
                                    <div style="font-weight:500;">${name}</div>
                                    <div style="font-size:12px;color:var(--text-secondary);">
                                        ${t.product || 'N/A'} • ${t.plan || 'N/A'} • ${t.paymentMethod || 'N/A'} • ${UI.formatDateTime(t.createdAt)}
                                    </div>
                                </div>
                                <div style="font-weight:600;color:#34C759;">${UI.formatCurrency(t.amount || 0)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderMonthly() {
        const year = this.reportDate.getFullYear();
        const month = this.reportDate.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);

        const monthlyTransactions = this.transactions.filter(t => {
            const d = new Date(t.createdAt);
            return d >= start && d < end;
        });

        const totalRevenue = monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalTransactions = monthlyTransactions.length;

        // Payment Breakdown
        const paymentBreakdown = monthlyTransactions.reduce((acc, t) => {
            const method = t.paymentMethod || 'Unknown';
            if (!acc[method]) acc[method] = { count: 0, revenue: 0 };
            acc[method].count++;
            acc[method].revenue += t.amount || 0;
            return acc;
        }, {});

        // Product Breakdown
        const productBreakdown = monthlyTransactions.reduce((acc, t) => {
            const product = t.product || 'Unknown';
            if (!acc[product]) acc[product] = { count: 0, revenue: 0 };
            acc[product].count++;
            acc[product].revenue += t.amount || 0;
            return acc;
        }, {});

        // Daily table
        let dailyTable = '';
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dayRevenue = this.getDayRevenue(date);
            const dayCount = this.getDayCount(date);
            dailyTable += `
                <tr>
                    <td style="padding:4px 8px;border-bottom:1px solid var(--border-color);">${d}</td>
                    <td style="padding:4px 8px;border-bottom:1px solid var(--border-color);">${date.toLocaleDateString('en-US', { weekday: 'short' })}</td>
                    <td style="padding:4px 8px;border-bottom:1px solid var(--border-color);text-align:right;">${UI.formatCurrency(dayRevenue)}</td>
                    <td style="padding:4px 8px;border-bottom:1px solid var(--border-color);text-align:center;">${dayCount}</td>
                </tr>
            `;
        }

        const paymentColors = {
            'KPay': { bg: 'rgba(0,122,255,0.15)', color: '#007AFF', icon: '💳' },
            'Wave Pay': { bg: 'rgba(255,204,0,0.15)', color: '#B8860B', icon: '📱' },
            'Aya Pay': { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30', icon: '🏦' }
        };

        return `
            <div style="background:var(--glass-bg);border-radius:var(--radius-lg);padding:var(--spacing-lg);border:1px solid var(--glass-border);backdrop-filter:blur(20px);">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--spacing-sm);margin-bottom:var(--spacing-lg);">
                    <h2>📈 ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                    <div style="display:flex;gap:var(--spacing-sm);">
                        <input type="month" value="${year}-${String(month + 1).padStart(2, '0')}" 
                               onchange="app.reports.changeMonth(this.value)" 
                               style="padding:8px 14px;border:1px solid var(--border-color);border-radius:var(--radius-full);background:var(--bg-secondary);font-family:var(--font-family);">
                        <button class="btn btn-primary" onclick="app.reports.exportPDF()">📄 PDF</button>
                        <button class="btn btn-success" onclick="app.reports.exportCSV()">📊 CSV</button>
                    </div>
                </div>

                <!-- Summary Stats -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--spacing-md);margin-bottom:var(--spacing-lg);">
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">💰 Total Revenue</div>
                        <div style="font-size:21px;font-weight:700;">${UI.formatCurrency(totalRevenue)}</div>
                    </div>
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">📝 Transactions</div>
                        <div style="font-size:21px;font-weight:700;">${totalTransactions}</div>
                    </div>
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">📊 Avg/Day</div>
                        <div style="font-size:21px;font-weight:700;">${UI.formatCurrency(daysInMonth ? totalRevenue / daysInMonth : 0)}</div>
                    </div>
                    <div style="background:var(--bg-tertiary);padding:var(--spacing-md);border-radius:var(--radius-sm);text-align:center;">
                        <div style="font-size:11px;color:var(--text-secondary);">🆕 New Members</div>
                        <div style="font-size:21px;font-weight:700;">${this.members.filter(m => { const d = new Date(m.createdAt); return d >= start && d < end; }).length}</div>
                    </div>
                </div>

                <!-- PAYMENT BREAKDOWN CARDS -->
                <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:var(--spacing-lg);margin-bottom:var(--spacing-lg);border:2px solid var(--primary);box-shadow:var(--shadow-hover);">
                    <h3 style="margin-bottom:var(--spacing-md);font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--primary);">
                        💳 Payment Breakdown (Monthly)
                        <span style="font-size:13px;font-weight:400;color:var(--text-secondary);margin-left:auto;">
                            ${Object.keys(paymentBreakdown).length} payment method(s)
                        </span>
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--spacing-md);">
                        ${Object.keys(paymentBreakdown).length === 0 ? `
                            <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:var(--spacing-xl);background:var(--bg-tertiary);border-radius:var(--radius-md);">
                                <div style="font-size:48px;margin-bottom:var(--spacing-sm);">💳</div>
                                <p style="font-size:15px;">No payments for this month</p>
                                <p style="font-size:12px;">Add members with different payment methods</p>
                            </div>
                        ` : Object.entries(paymentBreakdown).map(([method, data]) => {
                            const colors = paymentColors[method] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)', icon: '💰' };
                            const percent = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0;
                            return `
                                <div style="background:${colors.bg};padding:var(--spacing-lg);border-radius:var(--radius-md);text-align:center;border:2px solid ${colors.color}40;">
                                    <div style="font-size:36px;">${colors.icon}</div>
                                    <div style="font-weight:700;color:${colors.color};font-size:16px;margin-top:4px;">${method}</div>
                                    <div style="font-size:24px;font-weight:700;margin:8px 0;color:var(--text-primary);">${UI.formatCurrency(data.revenue)}</div>
                                    <div style="font-size:13px;color:var(--text-secondary);">${data.count} transaction${data.count > 1 ? 's' : ''}</div>
                                    <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${percent}% of total</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- PRODUCT BREAKDOWN CARDS -->
                <div style="background:var(--bg-secondary);border-radius:var(--radius-md);padding:var(--spacing-lg);margin-bottom:var(--spacing-lg);border:1px solid var(--border-color);">
                    <h3 style="margin-bottom:var(--spacing-md);font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;">
                        📦 Product Breakdown (Monthly)
                    </h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--spacing-md);">
                        ${Object.keys(productBreakdown).length === 0 ? `
                            <div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:var(--spacing-md);">
                                No products for this month
                            </div>
                        ` : Object.entries(productBreakdown).map(([product, data]) => {
                            const productColors = {
                                'Doujinshi': { bg: 'rgba(88,86,214,0.15)', color: '#5856D6' },
                                'Manhwa': { bg: 'rgba(255,149,0,0.15)', color: '#FF9500' }
                            };
                            const colors = productColors[product] || { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
                            return `
                                <div style="background:${colors.bg};padding:var(--spacing-md);border-radius:var(--radius-md);text-align:center;border:2px solid ${colors.color}40;">
                                    <div style="font-weight:700;color:${colors.color};font-size:15px;">${product}</div>
                                    <div style="font-size:22px;font-weight:700;margin:6px 0;color:var(--text-primary);">${UI.formatCurrency(data.revenue)}</div>
                                    <div style="font-size:12px;color:var(--text-secondary);">${data.count} transaction${data.count > 1 ? 's' : ''}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Daily Table -->
                <div style="max-height:400px;overflow-y:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead>
                            <tr>
                                <th style="text-align:left;padding:var(--spacing-xs);border-bottom:2px solid var(--border-color);color:var(--text-secondary);font-size:11px;text-transform:uppercase;">Day</th>
                                <th style="text-align:left;padding:var(--spacing-xs);border-bottom:2px solid var(--border-color);color:var(--text-secondary);font-size:11px;text-transform:uppercase;">Weekday</th>
                                <th style="text-align:right;padding:var(--spacing-xs);border-bottom:2px solid var(--border-color);color:var(--text-secondary);font-size:11px;text-transform:uppercase;">Revenue</th>
                                <th style="text-align:center;padding:var(--spacing-xs);border-bottom:2px solid var(--border-color);color:var(--text-secondary);font-size:11px;text-transform:uppercase;">Txs</th>
                            </tr>
                        </thead>
                        <tbody>${dailyTable}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getDayRevenue(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        return this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d >= start && d < end;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }

    getDayCount(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        return this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d >= start && d < end;
            }).length;
    }

    changeDate(value) {
        this.reportDate = new Date(value);
        this.render();
    }

    changeMonth(value) {
        const [year, month] = value.split('-');
        this.reportDate = new Date(parseInt(year), parseInt(month) - 1);
        this.render();
    }

    exportPDF() {
        UI.toast('📄 Opening print dialog...', 'info');
        setTimeout(() => window.print(), 500);
    }

    exportCSV() {
        UI.toast('📊 Generating CSV...', 'info');
        const date = this.reportDate;
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        const txs = this.transactions.filter(t => {
            const d = new Date(t.createdAt);
            return d >= start && d < end;
        });

        let csv = 'Username,Product,Plan,Amount,Payment,Date\n';
        txs.forEach(t => {
            const m = storage.getMember(t.memberId);
            csv += `${m ? m.username : 'Unknown'},${t.product},${t.plan},${t.amount},${t.paymentMethod},${t.createdAt}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${date.toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        UI.toast('✅ CSV exported successfully!', 'success');
    }
}