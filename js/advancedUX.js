// Advanced UX Improvements for PocketGNU - Phase 4
class AdvancedUX {
    constructor() {
        this.utils = window.PocketGNUUtils;
        this.errorHandler = window.PocketGNUErrorHandler;
        this.isInitialized = false;
        this.currentTheme = 'default';
        this.userPreferences = {};
        this.macros = [];
        this.gestureStartPos = null;
        this.speechRecognition = null;
        this.keyboardShortcuts = new Map();
    }

    // Initialize all advanced UX features
    init() {
        if (this.isInitialized) return;
        
        try {
            this.utils.measurePerformance('Advanced UX Initialization', () => {
                this.initLoadingStates();
                this.initToastNotifications();
                this.initGestureRecognition();
                this.initHapticFeedback();
                this.initVoiceCommands();
                this.initKeyboardShortcuts();
                this.initPersonalization();
                this.loadUserPreferences();
                this.isInitialized = true;
            });
            console.log('✅ Advanced UX features initialized successfully');
        } catch (error) {
            this.errorHandler.logCustomError('Failed to initialize Advanced UX', {
                error: error.message,
                stack: error.stack
            });
        }
    }

    // ===== LOADING STATES & FEEDBACK =====

    initLoadingStates() {
        // Create progress bar container if it doesn't exist
        if (!this.utils.safeQuerySelector('#progress-container')) {
            const progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.className = 'progress-container';
            document.body.appendChild(progressContainer);
        }
    }

    showSkeleton(selector) {
        try {
            const elements = this.utils.safeQuerySelectorAll(selector);
            elements.forEach(element => {
                element.classList.add('skeleton');
                element.setAttribute('aria-busy', 'true');
            });
        } catch (error) {
            this.errorHandler.logCustomError('Failed to show skeleton', { selector, error: error.message });
        }
    }

    hideSkeleton(selector) {
        try {
            const elements = this.utils.safeQuerySelectorAll(selector);
            elements.forEach(element => {
                element.classList.remove('skeleton');
                element.removeAttribute('aria-busy');
            });
        } catch (error) {
            this.errorHandler.logCustomError('Failed to hide skeleton', { selector, error: error.message });
        }
    }

    startProgress(message = 'Loading...') {
        try {
            const container = this.utils.safeQuerySelector('#progress-container');
            if (!container) return;

            container.innerHTML = `
                <div class="progress-overlay">
                    <div class="progress-content">
                        <div class="progress-message">${message}</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="main-progress-bar"></div>
                        </div>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        } catch (error) {
            this.errorHandler.logCustomError('Failed to start progress', { error: error.message });
        }
    }

    updateProgress(percentage) {
        try {
            const progressBar = this.utils.safeQuerySelector('#main-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
            }
        } catch (error) {
            this.errorHandler.logCustomError('Failed to update progress', { percentage, error: error.message });
        }
    }

    stopProgress() {
        try {
            const container = this.utils.safeQuerySelector('#progress-container');
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
        } catch (error) {
            this.errorHandler.logCustomError('Failed to stop progress', { error: error.message });
        }
    }

    // ===== TOAST NOTIFICATIONS =====

    initToastNotifications() {
        // Create toast container if it doesn't exist
        if (!this.utils.safeQuerySelector('#toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            toastContainer.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastContainer);
        }
    }

    showToast(message, options = {}) {
        try {
            const {
                type = 'info',
                duration = 5000,
                actionText = null,
                actionCallback = null,
                persistent = false
            } = options;

            const container = this.utils.safeQuerySelector('#toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.setAttribute('role', 'alert');

            let actionButton = '';
            if (actionText && actionCallback) {
                actionButton = `<button class="toast-action" data-action="true">${actionText}</button>`;
            }

            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-message">${message}</span>
                    ${actionButton}
                    <button class="toast-close" aria-label="Close notification">×</button>
                </div>
            `;

            // Add event listeners
            const closeBtn = toast.querySelector('.toast-close');
            this.utils.safeAddEventListener(closeBtn, 'click', () => this.removeToast(toast));

            if (actionButton) {
                const actionBtn = toast.querySelector('.toast-action');
                this.utils.safeAddEventListener(actionBtn, 'click', () => {
                    actionCallback();
                    this.removeToast(toast);
                });
            }

            container.appendChild(toast);

            // Animate in
            this.utils.safeSetTimeout(() => {
                toast.classList.add('toast-show');
            }, 100);

            // Auto-remove if not persistent
            if (!persistent) {
                this.utils.safeSetTimeout(() => {
                    this.removeToast(toast);
                }, duration);
            }

            return toast;
        } catch (error) {
            this.errorHandler.logCustomError('Failed to show toast', { message, options, error: error.message });
        }
    }

    removeToast(toast) {
        try {
            toast.classList.add('toast-hide');
            this.utils.safeSetTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        } catch (error) {
            this.errorHandler.logCustomError('Failed to remove toast', { error: error.message });
        }
    }

    // ===== GESTURE RECOGNITION & TOUCH =====

    initGestureRecognition() {
        if (!this.utils.supportsFeature('touchEvents')) return;

        const mainContainer = this.utils.safeQuerySelector('main') || document.body;
        
        this.utils.safeAddEventListener(mainContainer, 'touchstart', (e) => this.handleTouchStart(e));
        this.utils.safeAddEventListener(mainContainer, 'touchmove', (e) => this.handleTouchMove(e));
        this.utils.safeAddEventListener(mainContainer, 'touchend', (e) => this.handleTouchEnd(e));
    }

    handleTouchStart(e) {
        try {
            if (e.touches.length === 1) {
                this.gestureStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now()
                };
            }
        } catch (error) {
            this.errorHandler.logCustomError('Touch start error', { error: error.message });
        }
    }

    handleTouchMove(e) {
        // Prevent default scrolling for gesture detection
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        try {
            if (!this.gestureStartPos || e.changedTouches.length !== 1) return;

            const endPos = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY,
                time: Date.now()
            };

            const deltaX = endPos.x - this.gestureStartPos.x;
            const deltaY = endPos.y - this.gestureStartPos.y;
            const deltaTime = endPos.time - this.gestureStartPos.time;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Detect swipe gestures
            if (distance > 50 && deltaTime < 300) {
                const direction = Math.abs(deltaX) > Math.abs(deltaY) 
                    ? (deltaX > 0 ? 'right' : 'left')
                    : (deltaY > 0 ? 'down' : 'up');
                
                this.handleSwipeGesture(direction, e.target);
                this.triggerHapticFeedback('light');
            }

            this.gestureStartPos = null;
        } catch (error) {
            this.errorHandler.logCustomError('Touch end error', { error: error.message });
        }
    }

    handleSwipeGesture(direction, target) {
        try {
            // Custom swipe actions based on direction and target
            switch (direction) {
                case 'left':
                    if (target.closest('.demo-card')) {
                        this.showToast('Swipe left detected on demo card', { type: 'info' });
                    }
                    break;
                case 'right':
                    if (target.closest('.feature-card')) {
                        this.showToast('Swipe right detected on feature card', { type: 'info' });
                    }
                    break;
                case 'up':
                    // Quick scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    this.showToast('Scrolled to top', { type: 'success' });
                    break;
                case 'down':
                    // Show quick actions menu
                    this.showQuickActionsMenu();
                    break;
            }

            this.errorHandler.logCustomError('Swipe gesture detected', { 
                type: 'info', 
                direction, 
                target: target.className 
            });
        } catch (error) {
            this.errorHandler.logCustomError('Swipe gesture error', { direction, error: error.message });
        }
    }

    showQuickActionsMenu() {
        const actions = [
            { text: 'Open Settings', action: () => this.openPersonalizationModal() },
            { text: 'Toggle Theme', action: () => this.toggleTheme() },
            { text: 'Clear Cache', action: () => this.clearCache() }
        ];

        const menu = actions.map(action => 
            `<button class="quick-action-btn" data-action="${action.text}">${action.text}</button>`
        ).join('');

        this.showToast(`
            <div class="quick-actions">
                <div class="quick-actions-title">Quick Actions</div>
                ${menu}
            </div>
        `, { 
            type: 'info', 
            persistent: true,
            duration: 10000 
        });
    }

    // ===== HAPTIC FEEDBACK =====

    initHapticFeedback() {
        this.hapticSupported = 'vibrate' in navigator;
        if (this.hapticSupported) {
            console.log('✅ Haptic feedback supported');
        }
    }

    triggerHapticFeedback(type = 'light') {
        if (!this.hapticSupported) return;

        try {
            const patterns = {
                light: [50],
                medium: [100],
                heavy: [200],
                success: [50, 50, 50],
                error: [100, 50, 100, 50, 100],
                notification: [50, 100, 50]
            };

            navigator.vibrate(patterns[type] || patterns.light);
        } catch (error) {
            this.errorHandler.logCustomError('Haptic feedback error', { type, error: error.message });
        }
    }

    // ===== VOICE COMMANDS =====

    initVoiceCommands() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';

            this.speechRecognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase().trim();
                this.processVoiceCommand(command);
            };

            this.speechRecognition.onerror = (event) => {
                this.errorHandler.logCustomError('Speech recognition error', { error: event.error });
            };

            console.log('✅ Voice commands initialized');
        } catch (error) {
            this.errorHandler.logCustomError('Voice command initialization error', { error: error.message });
        }
    }

    startVoiceRecognition() {
        if (!this.speechRecognition) return;

        try {
            this.speechRecognition.start();
            this.showToast('Listening for voice command...', { type: 'info', duration: 3000 });
            this.triggerHapticFeedback('light');
        } catch (error) {
            this.errorHandler.logCustomError('Failed to start voice recognition', { error: error.message });
        }
    }

    processVoiceCommand(command) {
        try {
            const commands = {
                'open settings': () => this.openPersonalizationModal(),
                'close settings': () => this.closePersonalizationModal(),
                'toggle theme': () => this.toggleTheme(),
                'scroll to top': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                'show features': () => this.utils.safeQuerySelector('#features')?.scrollIntoView({ behavior: 'smooth' }),
                'show terminal': () => this.utils.safeQuerySelector('#terminal')?.scrollIntoView({ behavior: 'smooth' }),
                'clear cache': () => this.clearCache()
            };

            if (commands[command]) {
                commands[command]();
                this.showToast(`Voice command executed: "${command}"`, { type: 'success' });
                this.triggerHapticFeedback('success');
            } else {
                this.showToast(`Unknown voice command: "${command}"`, { type: 'warning' });
                this.triggerHapticFeedback('error');
            }
        } catch (error) {
            this.errorHandler.logCustomError('Voice command processing error', { command, error: error.message });
        }
    }

    // ===== KEYBOARD SHORTCUTS =====

    initKeyboardShortcuts() {
        // Define keyboard shortcuts
        this.keyboardShortcuts.set('ctrl+shift+s', () => this.openPersonalizationModal());
        this.keyboardShortcuts.set('ctrl+shift+t', () => this.toggleTheme());
        this.keyboardShortcuts.set('ctrl+shift+v', () => this.startVoiceRecognition());
        this.keyboardShortcuts.set('ctrl+shift+c', () => this.clearCache());
        this.keyboardShortcuts.set('escape', () => this.closePersonalizationModal());

        this.utils.safeAddEventListener(document, 'keydown', (e) => this.handleKeyboardShortcut(e));
        console.log('✅ Keyboard shortcuts initialized');
    }

    handleKeyboardShortcut(e) {
        try {
            const key = this.getKeyCombo(e);
            const action = this.keyboardShortcuts.get(key);
            
            if (action) {
                e.preventDefault();
                action();
                this.triggerHapticFeedback('light');
            }
        } catch (error) {
            this.errorHandler.logCustomError('Keyboard shortcut error', { error: error.message });
        }
    }

    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        if (e.metaKey) parts.push('meta');
        
        const key = e.key.toLowerCase();
        if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
            parts.push(key);
        }
        
        return parts.join('+');
    }

    // ===== PERSONALIZATION ENGINE =====

    initPersonalization() {
        this.createPersonalizationModal();
        this.loadUserPreferences();
    }

    createPersonalizationModal() {
        if (this.utils.safeQuerySelector('#settings-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'settings-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'settings-title');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="settings-overlay" data-close="true"></div>
            <div class="settings-content">
                <div class="settings-header">
                    <h2 id="settings-title" class="settings-title">Personalization Settings</h2>
                    <button class="settings-close" aria-label="Close settings">×</button>
                </div>
                <div class="settings-body">
                    <div class="settings-section">
                        <h3 class="settings-section-title">Theme Customization</h3>
                        <div class="theme-options">
                            <button class="theme-btn" data-theme="default">Default</button>
                            <button class="theme-btn" data-theme="dark">Dark</button>
                            <button class="theme-btn" data-theme="light">Light</button>
                            <button class="theme-btn" data-theme="custom">Custom</button>
                        </div>
                        <div class="custom-theme-controls" style="display: none;">
                            <label class="settings-label">Primary Color:</label>
                            <input type="color" id="primary-color" class="color-input" value="#1e40af">
                            <label class="settings-label">Background Color:</label>
                            <input type="color" id="background-color" class="color-input" value="#0f172a">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="settings-section-title">Layout Preferences</h3>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="compact-layout"> Compact Layout
                        </label>
                        <label class="settings-checkbox">
                            <input type="checkbox" id="show-animations"> Enable Animations
                        </label>
                    </div>
                    <div class="settings-section">
                        <h3 class="settings-section-title">Workflow Automation</h3>
                        <button class="btn btn-secondary" id="manage-macros">Manage Macros</button>
                        <button class="btn btn-secondary" id="ai-suggestions">AI Suggestions</button>
                    </div>
                </div>
                <div class="settings-footer">
                    <button class="btn btn-primary" id="save-settings">Save Settings</button>
                    <button class="btn btn-secondary" id="reset-settings">Reset to Default</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.bindPersonalizationEvents();
    }

    bindPersonalizationEvents() {
        const modal = this.utils.safeQuerySelector('#settings-modal');
        if (!modal) return;

        // Close modal events
        this.utils.safeAddEventListener(modal.querySelector('.settings-close'), 'click', () => this.closePersonalizationModal());
        this.utils.safeAddEventListener(modal.querySelector('.settings-overlay'), 'click', () => this.closePersonalizationModal());

        // Theme selection
        const themeButtons = modal.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            this.utils.safeAddEventListener(btn, 'click', (e) => {
                themeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.handleThemeSelection(e.target.dataset.theme);
            });
        });

        // Save settings
        this.utils.safeAddEventListener(modal.querySelector('#save-settings'), 'click', () => this.saveUserPreferences());

        // Reset settings
        this.utils.safeAddEventListener(modal.querySelector('#reset-settings'), 'click', () => this.resetUserPreferences());

        // AI suggestions
        this.utils.safeAddEventListener(modal.querySelector('#ai-suggestions'), 'click', () => this.toggleAISuggestions());
    }

    openPersonalizationModal() {
        const modal = this.utils.safeQuerySelector('#settings-modal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            this.triggerHapticFeedback('light');
        }
    }

    closePersonalizationModal() {
        const modal = this.utils.safeQuerySelector('#settings-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    handleThemeSelection(theme) {
        this.currentTheme = theme;
        
        if (theme === 'custom') {
            const customControls = this.utils.safeQuerySelector('.custom-theme-controls');
            if (customControls) customControls.style.display = 'block';
        } else {
            const customControls = this.utils.safeQuerySelector('.custom-theme-controls');
            if (customControls) customControls.style.display = 'none';
            this.applyTheme(theme);
        }
    }

    applyTheme(theme) {
        const themes = {
            default: {
                '--primary-color': '#1e40af',
                '--background-color': '#0f172a',
                '--card-background': '#1e293b',
                '--text-color': '#e0e7ff'
            },
            dark: {
                '--primary-color': '#3b82f6',
                '--background-color': '#000000',
                '--card-background': '#111111',
                '--text-color': '#ffffff'
            },
            light: {
                '--primary-color': '#2563eb',
                '--background-color': '#ffffff',
                '--card-background': '#f8fafc',
                '--text-color': '#1e293b'
            }
        };

        const themeColors = themes[theme];
        if (themeColors) {
            Object.entries(themeColors).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
            });
        }
    }

    toggleTheme() {
        const themes = ['default', 'dark', 'light'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        
        this.currentTheme = nextTheme;
        this.applyTheme(nextTheme);
        this.showToast(`Theme changed to ${nextTheme}`, { type: 'success' });
        this.triggerHapticFeedback('medium');
    }

    saveUserPreferences() {
        try {
            const preferences = {
                theme: this.currentTheme,
                compactLayout: this.utils.safeQuerySelector('#compact-layout')?.checked || false,
                showAnimations: this.utils.safeQuerySelector('#show-animations')?.checked || true,
                customColors: {
                    primary: this.utils.safeQuerySelector('#primary-color')?.value || '#1e40af',
                    background: this.utils.safeQuerySelector('#background-color')?.value || '#0f172a'
                }
            };

            this.utils.safeLocalStorageSet('pocketgnu_preferences', preferences);
            this.userPreferences = preferences;
            this.showToast('Settings saved successfully!', { type: 'success' });
            this.closePersonalizationModal();
            this.triggerHapticFeedback('success');
        } catch (error) {
            this.errorHandler.logCustomError('Failed to save preferences', { error: error.message });
            this.showToast('Failed to save settings', { type: 'error' });
        }
    }

    loadUserPreferences() {
        try {
            const preferences = this.utils.safeLocalStorageGet('pocketgnu_preferences', {});
            this.userPreferences = preferences;

            if (preferences.theme) {
                this.currentTheme = preferences.theme;
                this.applyTheme(preferences.theme);
            }

            // Apply other preferences
            if (preferences.compactLayout) {
                document.body.classList.add('compact-layout');
            }

            if (preferences.showAnimations === false) {
                document.body.classList.add('no-animations');
            }
        } catch (error) {
            this.errorHandler.logCustomError('Failed to load preferences', { error: error.message });
        }
    }

    resetUserPreferences() {
        try {
            localStorage.removeItem('pocketgnu_preferences');
            this.userPreferences = {};
            this.currentTheme = 'default';
            this.applyTheme('default');
            document.body.classList.remove('compact-layout', 'no-animations');
            this.showToast('Settings reset to default', { type: 'info' });
            this.closePersonalizationModal();
            this.triggerHapticFeedback('medium');
        } catch (error) {
            this.errorHandler.logCustomError('Failed to reset preferences', { error: error.message });
        }
    }

    // ===== AI-POWERED SUGGESTIONS =====

    async toggleAISuggestions() {
        try {
            const apiKey = this.utils.safeLocalStorageGet('openrouter_api_key');
            
            if (!apiKey) {
                const key = prompt('Enter your OpenRouter API key for AI suggestions:');
                if (key) {
                    this.utils.safeLocalStorageSet('openrouter_api_key', key);
                    this.showToast('API key saved. AI suggestions enabled!', { type: 'success' });
                } else {
                    this.showToast('API key required for AI suggestions', { type: 'warning' });
                    return;
                }
            }

            // Test AI suggestions with a sample query
            await this.fetchAISuggestions('help me with linux commands');
        } catch (error) {
            this.errorHandler.logCustomError('AI suggestions error', { error: error.message });
            this.showToast('Failed to enable AI suggestions', { type: 'error' });
        }
    }

    async fetchAISuggestions(query) {
        try {
            const apiKey = this.utils.safeLocalStorageGet('openrouter_api_key');
            if (!apiKey) {
                throw new Error('API key not found');
            }

            this.startProgress('Getting AI suggestions...');

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'PocketGNU'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful Linux terminal assistant. Provide concise, practical command suggestions and explanations.'
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            this.stopProgress();

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const suggestion = data.choices[0]?.message?.content || 'No suggestion available';

            this.showToast(`AI Suggestion: ${suggestion}`, {
                type: 'info',
                duration: 10000,
                actionText: 'Copy',
                actionCallback: () => navigator.clipboard?.writeText(suggestion)
            });

            return suggestion;
        } catch (error) {
            this.stopProgress();
            this.errorHandler.logCustomError('AI suggestions fetch error', { query, error: error.message });
            this.showToast('Failed to get AI suggestions', { type: 'error' });
            throw error;
        }
    }

    // ===== UTILITY METHODS =====

    clearCache() {
        try {
            localStorage.clear();
            this.showToast('Cache cleared successfully', { type: 'success' });
            this.triggerHapticFeedback('medium');
        } catch (error) {
            this.errorHandler.logCustomError('Failed to clear cache', { error: error.message });
            this.showToast('Failed to clear cache', { type: 'error' });
        }
    }

    // Demo method to show skeleton loading
    demoSkeletonLoading() {
        this.showSkeleton('.stat-card');
        this.utils.safeSetTimeout(() => {
            this.hideSkeleton('.stat-card');
        }, 3000);
    }

    // Demo method to show progress
    demoProgress() {
        this.startProgress('Processing data...');
        let progress = 0;
        const interval = this.utils.safeSetInterval(() => {
            progress += 10;
            this.updateProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                this.stopProgress();
                this.showToast('Process completed!', { type: 'success' });
            }
        }, 200);
    }
}

// Create global AdvancedUX instance
window.AdvancedUX = new AdvancedUX();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedUX;
}
