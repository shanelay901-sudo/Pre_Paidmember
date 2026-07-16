/**
 * ========================================
 * Calendar Module
 * Displays monthly revenue calendar
 * ========================================
 */

class Calendar {
    constructor(container) {
        this.container = container;
        this.transactions = storage.getTransactions();
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.selectedDate = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="calendar-page">
                <div class="page-header">
                    <h1>Revenue Calendar</h1>
                    <div class="calendar-nav">
                        <button class="btn-icon" onclick="app.calendar.navigateMonth(-1)">←</button>
                        <h2 id="calendarTitle">${this.getMonthYear()}</h2>
                        <button class="btn-icon" onclick="app.calendar.navigateMonth(1)">→</button>
                        <button class="btn btn-primary" onclick="app.calendar.goToToday()">Today</button>
                    </div>
                </div>

                <div class="calendar-container glass">
                    <div class="calendar-grid" id="calendarGrid">
                        ${this.renderCalendar()}
                    </div>
                </div>

                <div class="calendar-summary glass" id="calendarSummary">
                    ${this.renderSummary()}
                </div>

                <div class="calendar-transactions glass" id="calendarTransactions">
                    <h3>Transactions</h3>
                    <div id="dayTransactions">
                        ${this.renderDayTransactions()}
                    </div>
                </div>
            </div>
        `;
    }

    getMonthYear() {
        const date = new Date(this.currentYear, this.currentMonth);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    renderCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        let html = `
            <div class="calendar-header">
                <div class="calendar-day">Sun</div>
                <div class="calendar-day">Mon</div>
                <div class="calendar-day">Tue</div>
                <div class="calendar-day">Wed</div>
                <div class="calendar-day">Thu</div>
                <div class="calendar-day">Fri</div>
                <div class="calendar-day">Sat</div>
            </div>
            <div class="calendar-days">
        `;

        // Empty cells for days before the 1st
        for (let i = 0; i < startDay; i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }

        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isToday = date.toDateString() === today.toDateString();
            const revenue = this.getDayRevenue(date);
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            const hasRevenue = revenue > 0;

            html += `
                <div class="calendar-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasRevenue ? 'has-revenue' : ''}"
                     onclick="app.calendar.selectDate(${day})">
                    <div class="calendar-date">${day}</div>
                    ${hasRevenue ? `<div class="calendar-revenue">${UI.formatCurrency(revenue)}</div>` : ''}
                </div>
            `;
        }

        html += '</div></div>';
        return html;
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

    getDayTransactions(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        return this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d >= start && d < end;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    renderSummary() {
        const totalRevenue = this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalTransactions = this.transactions
            .filter(t => {
                const d = new Date(t.createdAt);
                return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
            }).length;

        const daysWithRevenue = new Set(
            this.transactions
                .filter(t => {
                    const d = new Date(t.createdAt);
                    return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
                })
                .map(t => new Date(t.createdAt).getDate())
        ).size;

        const avgDaily = daysWithRevenue > 0 ? totalRevenue / daysWithRevenue : 0;

        return `
            <h3>Monthly Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Total Revenue</div>
                    <div class="summary-value">${UI.formatCurrency(totalRevenue)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Transactions</div>
                    <div class="summary-value">${totalTransactions}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Days with Revenue</div>
                    <div class="summary-value">${daysWithRevenue}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Average Daily</div>
                    <div class="summary-value">${UI.formatCurrency(avgDaily)}</div>
                </div>
            </div>
        `;
    }

    renderDayTransactions() {
        if (!this.selectedDate) {
            return `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <p>Click a date on the calendar to view transactions</p>
                </div>
            `;
        }

        const transactions = this.getDayTransactions(this.selectedDate);
        const revenue = this.getDayRevenue(this.selectedDate);

        if (transactions.length === 0) {
            return `
                <div class="empty-state" style="padding: var(--spacing-xl);">
                    <p>No transactions on ${this.selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            `;
        }

        let html = `
            <div style="margin-bottom: var(--spacing-md);">
                <strong>${this.selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                <span style="margin-left: var(--spacing-md); color: var(--success);">Total: ${UI.formatCurrency(revenue)}</span>
            </div>
            <div class="transaction-list">
        `;

        transactions.forEach(t => {
            const member = storage.getMember(t.memberId);
            const name = member ? member.username : 'Unknown Member';
            const initial = name.charAt(0).toUpperCase();

            html += `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-avatar">${initial}</div>
                        <div class="transaction-details">
                            <div class="name">${name}</div>
                            <div class="product">${t.product || 'N/A'} • ${t.plan || 'N/A'} • ${UI.formatDateTime(t.createdAt)}</div>
                        </div>
                    </div>
                    <div class="transaction-amount positive">${UI.formatCurrency(t.amount || 0)}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    selectDate(day) {
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
        this.render();
        document.querySelector('.calendar-transactions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    navigateMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.selectedDate = null;
        this.render();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectedDate = today;
        this.render();
    }
}