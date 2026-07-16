/**
 * ========================================
 * Membership Manager Pro - Main Application
 * ========================================
 */

class App {
    constructor() {
        // Initialize components
        this.currentPage = 'dashboard';
        this.dashboard = null;
        this.members = null;
        this.analytics = null;
        this.calendar = null;
        this.reports = null;
        
        // DOM References
        this.mainContent = document.getElementById('mainContent');
        this.navLinks = document.querySelectorAll('.nav-link[data-page]');
        this.themeToggle = document.getElementById('themeToggle');
        this.globalSearch = document.getElementById('globalSearch');
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleThemeToggle = this.handleThemeToggle.bind(this);
        this.handleGlobalSearch = this.handleGlobalSearch.bind(this);
        this.updateDateTime = this.updateDateTime.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Load theme preference
        this.loadTheme();
        
        // Set up navigation
        this.setupNavigation();
        
        // Load initial page
        this.navigateTo('dashboard');
        
        // Event listeners
        this.themeToggle.addEventListener('click', this.handleThemeToggle);
        if (this.globalSearch) {
            this.globalSearch.addEventListener('keypress', this.handleGlobalSearch);
        }
        
        // Start clock
        this.updateDateTime();
        setInterval(this.updateDateTime, 10000);
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        console.log('Membership Manager Pro initialized');
    }
    
    setupNavigation() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    navigateTo(page) {
        // Update active nav link
        this.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        // Load page content
        this.loadPage(page);
        
        // Update current page
        this.currentPage = page;
        
        // Update URL hash
        window.location.hash = page;
    }
    
    loadPage(page) {
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'members':
                this.loadMembers();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'calendar':
                this.loadCalendar();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
            default:
                this.loadDashboard();
        }
    }
    
    loadDashboard() {
        if (!this.dashboard) {
            this.dashboard = new Dashboard(this.mainContent);
        }
        this.dashboard.render();
    }
    
    loadMembers() {
        if (!this.members) {
            this.members = new Members(this.mainContent);
        }
        this.members.render();
    }
    
    loadAnalytics() {
        if (!this.analytics) {
            this.analytics = new Analytics(this.mainContent);
        }
        this.analytics.render();
    }
    
    loadCalendar() {
        if (!this.calendar) {
            this.calendar = new Calendar(this.mainContent);
        }
        this.calendar.render();
    }
    
    loadReports() {
        if (!this.reports) {
            this.reports = new Reports(this.mainContent);
        }
        this.reports.render();
    }
    
    loadSettings() {
        const stats = storage.getStats();
        this.mainContent.innerHTML = `
            <div class="settings-page" style="animation: fadeIn 0.4s ease;">
                <div class="page-header">
                    <h1>Settings</h1>
                </div>
                <div class="glass" style="padding: var(--spacing-lg);">
                    <h2 style="margin-bottom: var(--spacing-lg);">Data Management</h2>
                    <div style="display: flex; gap: var(--spacing-md); margin-top: var(--spacing-md); flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="app.exportData()">📤 Export Data</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">📥 Import Data</button>
                        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="app.handleImport(event)">
                        <button class="btn btn-danger" onclick="app.handleClearData()">🗑️ Clear All Data</button>
                    </div>
                    <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: var(--spacing-md);">Storage Statistics</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-md);">
                            <div><strong>Total Members:</strong> ${stats.totalMembers}</div>
                            <div><strong>Total Transactions:</strong> ${stats.totalTransactions}</div>
                            <div><strong>Total Revenue:</strong> ${UI.formatCurrency(stats.totalRevenue)}</div>
                            <div><strong>Storage Used:</strong> ${(stats.storageUsed / 1024).toFixed(2)} KB</div>
                            <div><strong>Last Updated:</strong> ${new Date(stats.lastUpdated).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    handleThemeToggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('svg');
        if (theme === 'dark') {
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            `;
        } else {
            icon.innerHTML = `
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.5 5.5 0 0 1-7.54-7.54c-.44-.06-.9-.1-1.36-.1z"/>
            `;
        }
    }
    
    updateDateTime() {
        const now = new Date();
        const dateEl = document.getElementById('currentDate');
        const timeEl = document.getElementById('currentTime');
        
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        if (timeEl) {
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeEl.textContent = `${hours}:${minutes}${ampm}`;
        }
    }
    
    handleGlobalSearch(e) {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                // Navigate to members and search
                this.navigateTo('members');
                // Wait for members to load then set search
                setTimeout(() => {
                    if (this.members) {
                        const searchInput = document.getElementById('memberSearch');
                        if (searchInput) {
                            searchInput.value = query;
                            searchInput.dispatchEvent(new Event('input'));
                        }
                    }
                }, 100);
            }
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + 1-5 for navigation
            if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const pages = ['dashboard', 'members', 'analytics', 'calendar', 'reports'];
                this.navigateTo(pages[parseInt(e.key) - 1]);
            }
            
            // Ctrl + / for search
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                const searchInput = this.globalSearch || document.getElementById('globalSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape key for modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
                const searchInput = this.globalSearch || document.getElementById('globalSearch');
                if (searchInput) searchInput.blur();
            }
        });
    }
    
    // Export data
    exportData() {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `membership_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('Data exported successfully!', 'success');
    }
    
    // Handle import file
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = confirm('⚠️ This will replace ALL current data. Continue?');
            if (result) {
                const success = storage.importData(e.target.result);
                if (success) {
                    UI.toast('Data imported successfully!', 'success');
                    // Reload all components
                    this.dashboard = null;
                    this.members = null;
                    this.analytics = null;
                    this.calendar = null;
                    this.reports = null;
                    this.navigateTo(this.currentPage);
                } else {
                    UI.toast('Error importing data. Please check the file format.', 'error');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    // Handle clear data
    handleClearData() {
        const result = confirm('⚠️ This will delete ALL data. Are you sure?');
        if (result) {
            const confirmAgain = confirm('⚠️ REALLY delete ALL data? This cannot be undone!');
            if (confirmAgain) {
                storage.clearAllData();
                UI.toast('All data cleared.', 'warning');
                this.dashboard = null;
                this.members = null;
                this.analytics = null;
                this.calendar = null;
                this.reports = null;
                this.navigateTo(this.currentPage);
            }
        }
    }
}

// Make app globally available
window.app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});