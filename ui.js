/**
 * ========================================
 * UI Utilities - Reusable UI Components
 * ========================================
 */

class UI {
    /**
     * Create a glass card
     */
    static createCard(content, className = '') {
        const card = document.createElement('div');
        card.className = `glass ${className}`;
        card.innerHTML = content;
        return card;
    }
    
    /**
     * Create a modal
     */
    static createModal(title, content, onClose = null) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal glass';
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onClose) onClose();
            }
        });
        
        return overlay;
    }
    
    /**
     * Create a form input
     */
    static createInput(label, type, name, options = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.htmlFor = name;
        labelEl.textContent = label;
        wrapper.appendChild(labelEl);
        
        let input;
        if (type === 'select') {
            input = document.createElement('select');
            input.id = name;
            input.name = name;
            options.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.selected) option.selected = true;
                input.appendChild(option);
            });
        } else if (type === 'textarea') {
            input = document.createElement('textarea');
            input.id = name;
            input.name = name;
            input.rows = options.rows || 3;
            if (options.value) input.value = options.value;
        } else {
            input = document.createElement('input');
            input.type = type;
            input.id = name;
            input.name = name;
            if (options.value) input.value = options.value;
            if (options.placeholder) input.placeholder = options.placeholder;
            if (options.required) input.required = true;
        }
        
        if (options.className) input.className = options.className;
        wrapper.appendChild(input);
        
        if (options.help) {
            const help = document.createElement('small');
            help.className = 'form-help';
            help.textContent = options.help;
            wrapper.appendChild(help);
        }
        
        return wrapper;
    }
    
    /**
     * Create a button
     */
    static createButton(text, type = 'primary', onClick = null) {
        const btn = document.createElement('button');
        btn.className = `btn btn-${type}`;
        btn.textContent = text;
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }
    
    /**
     * Create a badge
     */
    static createBadge(text, type = 'default') {
        const badge = document.createElement('span');
        badge.className = `badge badge-${type}`;
        badge.textContent = text;
        return badge;
    }
    
    /**
     * Create a table
     */
    static createTable(headers, rows, className = '') {
        const table = document.createElement('table');
        table.className = `table ${className}`;
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        rows.forEach(rowData => {
            const tr = document.createElement('tr');
            rowData.forEach(cellData => {
                const td = document.createElement('td');
                td.innerHTML = cellData;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        
        return table;
    }
    
    /**
     * Show a toast notification
     */
    static toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer') || (() => {
            const c = document.createElement('div');
            c.id = 'toastContainer';
            document.body.appendChild(c);
            return c;
        })();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
    /**
     * Format currency
     */
    static formatCurrency(amount) {
        return `${amount.toLocaleString()} Ks`;
    }
    
    /**
     * Format date
     */
    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Format datetime
     */
    static formatDateTime(date) {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Get status badge for expiry
     */
    static getExpiryStatus(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const daysDiff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) {
            return { label: 'Expired', type: 'danger' };
        } else if (daysDiff === 0) {
            return { label: 'Expires Today', type: 'warning' };
        } else if (daysDiff <= 3) {
            return { label: `Expires in ${daysDiff}d`, type: 'warning' };
        } else if (daysDiff <= 7) {
            return { label: `Expires in ${daysDiff}d`, type: 'info' };
        } else {
            return { label: 'Active', type: 'success' };
        }
    }
    
    /**
     * Debounce function
     */
    static debounce(fn, delay = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle function
     */
    static throttle(fn, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Add toast container styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    #toastContainer {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    }
    
    .toast {
        padding: 12px 16px;
        background: var(--glass-bg);
        backdrop-filter: saturate(180%) blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-hover);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        font-size: var(--font-size-sm);
    }
    
    .toast-hide {
        animation: slideOutRight 0.3s ease forwards;
    }
    
    .toast-success {
        border-left: 4px solid var(--success);
    }
    .toast-error {
        border-left: 4px solid var(--danger);
    }
    .toast-warning {
        border-left: 4px solid var(--warning);
    }
    .toast-info {
        border-left: 4px solid var(--primary);
    }
    
    .toast-icon {
        font-size: 18px;
    }
    
    .toast-message {
        flex: 1;
    }
    
    .toast-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: var(--text-secondary);
        padding: 0 4px;
    }
    
    .toast-close:hover {
        color: var(--text-primary);
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(toastStyles);