// PocketGNU Website JavaScript - Enhanced with Error Handling
document.addEventListener('DOMContentLoaded', function() {
    const utils = window.PocketGNUUtils;
    const errorHandler = window.PocketGNUErrorHandler;
    
    if (!utils || !errorHandler) {
        console.error('Required utilities not loaded. Please ensure errorHandler.js and utils.js are loaded first.');
        return;
    }

    // Initialize offline detection UI
    utils.initOfflineDetection();

    // Initialize all components with enhanced error handling
    const initComponents = [
        { name: 'Countdown', func: initCountdown },
        { name: 'Terminal Animation', func: initTerminalAnimation },
        { name: 'Smooth Scrolling', func: initSmoothScrolling },
        { name: 'Activity Feed', func: initActivityFeed },
        { name: 'Stats Animation', func: initStatsAnimation }
    ];

    initComponents.forEach(component => {
        try {
            utils.measurePerformance(component.name, component.func);
            console.log(`✅ ${component.name} initialized successfully`);
        } catch(error) {
            errorHandler.logCustomError(`Failed to initialize ${component.name}`, {
                component: component.name,
                error: error.message,
                stack: error.stack
            });
        }
    });

    // Example usage of safeAsyncRetry for a demo async operation
    async function demoAsyncOperation() {
        // Simulate a network call with 50% chance of failure
        if (Math.random() < 0.5) {
            throw new Error('Simulated network error');
        }
        return 'Data loaded successfully';
    }

    utils.safeAsyncRetry(demoAsyncOperation, 3, 1000, 'Demo API Call')
        .then(data => console.log(data))
        .catch(error => errorHandler.logCustomError('Final failure in demoAsyncOperation', { error: error.message }));

    // Initialize Phase 4: Advanced UX features
    if (window.AdvancedUX && typeof window.AdvancedUX.init === 'function') {
        try {
            window.AdvancedUX.init();
            console.log('✅ Phase 4: Advanced UX features initialized successfully');
            
            // Bind demo buttons in settings modal
            const demoSkeletonBtn = utils.safeQuerySelector('#demo-skeleton');
            if (demoSkeletonBtn) {
                utils.safeAddEventListener(demoSkeletonBtn, 'click', () => {
                    window.AdvancedUX.demoSkeletonLoading();
                });
            }

            const demoProgressBtn = utils.safeQuerySelector('#demo-progress');
            if (demoProgressBtn) {
                utils.safeAddEventListener(demoProgressBtn, 'click', () => {
                    window.AdvancedUX.demoProgress();
                });
            }

            const startVoiceBtn = utils.safeQuerySelector('#start-voice');
            if (startVoiceBtn) {
                utils.safeAddEventListener(startVoiceBtn, 'click', () => {
                    window.AdvancedUX.startVoiceRecognition();
                });
            }

            // Add settings button to header navigation
            const nav = utils.safeQuerySelector('.nav');
            if (nav) {
                const settingsLink = document.createElement('a');
                settingsLink.href = '#';
                settingsLink.className = 'nav-link';
                settingsLink.textContent = 'Settings';
                settingsLink.setAttribute('aria-label', 'Open personalization settings');
                
                utils.safeAddEventListener(settingsLink, 'click', (e) => {
                    e.preventDefault();
                    window.AdvancedUX.openPersonalizationModal();
                });
                
                nav.appendChild(settingsLink);
            }

            // Show welcome toast
            setTimeout(() => {
                window.AdvancedUX.showToast('Welcome to Phase 4! Try the new advanced UX features.', {
                    type: 'info',
                    duration: 8000,
                    actionText: 'Open Settings',
                    actionCallback: () => window.AdvancedUX.openPersonalizationModal()
                });
            }, 2000);

        } catch (error) {
            errorHandler.logCustomError('Failed to initialize Advanced UX features', {
                error: error.message,
                stack: error.stack
            });
        }
    } else {
        console.warn('⚠️ Advanced UX features not available');
    }
});

// Countdown Timer Functionality - Enhanced
function initCountdown() {
    const utils = window.PocketGNUUtils;
    const errorHandler = window.PocketGNUErrorHandler;
    
    const countdownElement = utils.safeQuerySelector('#countdown-timer');
    if (!countdownElement) {
        errorHandler.logCustomError('Countdown element not found', { selector: '#countdown-timer' });
        return;
    }

    // Get target date from localStorage or set default (24 hours from now)
    let targetDate = utils.safeLocalStorageGet('countdown-target');
    if (!targetDate) {
        targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + 24);
        utils.safeLocalStorageSet('countdown-target', targetDate.getTime());
    } else {
        targetDate = new Date(targetDate);
    }

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            countdownElement.textContent = '0h0m0s';
            countdownElement.classList.add('expired');
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.textContent = `${hours}h${minutes}m${seconds}s`;
        countdownElement.classList.remove('expired');
    }

    // Initial update and start interval
    updateCountdown();
    const intervalId = utils.safeSetInterval(updateCountdown, 1000);
    
    // Store interval ID for potential cleanup
    window.countdownInterval = intervalId;
}

// Terminal Animation - Enhanced
function initTerminalAnimation() {
    const utils = window.PocketGNUUtils;
    const errorHandler = window.PocketGNUErrorHandler;
    
    const commandElement = utils.safeQuerySelector('#terminal-command');
    if (!commandElement) {
        errorHandler.logCustomError('Terminal command element not found', { selector: '#terminal-command' });
        return;
    }

    const commands = [
        'ls -la',
        'cd projects',
        'git clone https://github.com/user/app.git',
        'npm install',
        'npm run dev',
        'echo "PocketGNU is awesome!"'
    ];

    let currentCommandIndex = 0;
    let currentCharIndex = 0;
    let isTyping = false;
    let animationTimeouts = [];

    function typeCommand() {
        if (isTyping) return; // Prevent multiple animations
        
        isTyping = true;
        const currentCommand = commands[currentCommandIndex];
        
        if (currentCharIndex < currentCommand.length) {
            commandElement.textContent = currentCommand.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            
            const timeout = utils.safeSetTimeout(() => {
                typeCommand();
            }, 100);
            animationTimeouts.push(timeout);
        } else {
            const timeout = utils.safeSetTimeout(() => {
                currentCharIndex = 0;
                currentCommandIndex = (currentCommandIndex + 1) % commands.length;
                isTyping = false;
                typeCommand();
            }, 2000);
            animationTimeouts.push(timeout);
        }
    }

    // Start animation
    typeCommand();
    
    // Store cleanup function for potential use
    window.cleanupTerminalAnimation = () => {
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        isTyping = false;
    };
}

// Smooth Scrolling for Navigation - Enhanced
function initSmoothScrolling() {
    const utils = window.PocketGNUUtils;
    const errorHandler = window.PocketGNUErrorHandler;

    // Helper function for smooth scrolling with error handling
    function smoothScrollTo(targetSelector, sourceElement = null) {
        const targetSection = utils.safeQuerySelector(targetSelector);
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
            
            // Track scroll action for analytics
            errorHandler.logCustomError('Smooth scroll action', {
                type: 'info',
                target: targetSelector,
                source: sourceElement ? sourceElement.id || sourceElement.className : 'unknown'
            });
        } else {
            errorHandler.logCustomError('Scroll target not found', {
                target: targetSelector,
                source: sourceElement ? sourceElement.id || sourceElement.className : 'unknown'
            });
        }
    }

    // Get Started button
    const getStartedBtn = utils.safeQuerySelector('#get-started');
    if (getStartedBtn) {
        utils.safeAddEventListener(getStartedBtn, 'click', function(e) {
            e.preventDefault();
            smoothScrollTo('#choose-your-path', this);
        });
    }

    // Learn More button
    const learnMoreBtn = utils.safeQuerySelector('#learn-more');
    if (learnMoreBtn) {
        utils.safeAddEventListener(learnMoreBtn, 'click', function(e) {
            e.preventDefault();
            smoothScrollTo('#features', this);
        });
    }

    // Navigation links
    const navLinks = utils.safeQuerySelectorAll('.nav-link');
    navLinks.forEach(link => {
        utils.safeAddEventListener(link, 'click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                smoothScrollTo(`#${targetId}`, this);
            }
        });
    });

    // Demo buttons with enhanced interaction
    const demoButtons = utils.safeQuerySelectorAll('.btn-outline');
    demoButtons.forEach(button => {
        utils.safeAddEventListener(button, 'click', function(e) {
            e.preventDefault();
            
            // Store original text
            const originalText = this.textContent;
            
            // Show loading state
            this.textContent = 'Demo Loading...';
            this.disabled = true;
            this.classList.add('loading');
            
            // Simulate demo interaction with timeout cleanup
            const timeout = utils.safeSetTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                this.classList.remove('loading');
            }, 2000);
            
            // Store timeout for potential cleanup
            this.demoTimeout = timeout;
        });
    });
}

// Activity Feed Animation
function initActivityFeed() {
    try {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        const activities = [
            {
                avatar: 'JD',
                name: 'John Doe',
                location: 'New York',
                action: 'deployed app weather-tracker',
                time: 'just now'
            },
            {
                avatar: 'AS',
                name: 'Anna Smith',
                location: 'Berlin',
                action: 'executed script data-analysis',
                time: 'just now'
            },
            {
                avatar: 'MJ',
                name: 'Mike Johnson',
                location: 'Tokyo',
                action: 'pushed to repository mobile-ui',
                time: 'just now'
            },
            {
                avatar: 'LW',
                name: 'Lisa Wang',
                location: 'Sydney',
                action: 'configured environment docker-setup',
                time: 'just now'
            }
        ];

        function addNewActivity() {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.style.opacity = '0';
            activityItem.style.transform = 'translateY(-20px)';
            
            activityItem.innerHTML = `
                <div class="activity-avatar">${randomActivity.avatar}</div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-name">${randomActivity.name}</span>
                        <span class="activity-location">${randomActivity.location}</span>
                    </div>
                    <div class="activity-action">${randomActivity.action}</div>
                    <div class="activity-time">${randomActivity.time}</div>
                </div>
            `;

            // Insert at the beginning
            activityFeed.insertBefore(activityItem, activityFeed.firstChild);

            // Animate in
            setTimeout(() => {
                activityItem.style.transition = 'all 0.3s ease';
                activityItem.style.opacity = '1';
                activityItem.style.transform = 'translateY(0)';
            }, 100);

            // Remove excess items (keep only 5)
            const items = activityFeed.querySelectorAll('.activity-item');
            if (items.length > 5) {
                const lastItem = items[items.length - 1];
                lastItem.style.transition = 'all 0.3s ease';
                lastItem.style.opacity = '0';
                lastItem.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    if (lastItem.parentNode) {
                        lastItem.parentNode.removeChild(lastItem);
                    }
                }, 300);
            }
        }

        // Add new activity every 5 seconds
        setInterval(addNewActivity, 5000);

    } catch(error) {
        console.error('Activity feed initialization error:', error);
    }
}

// Button Click Handlers
document.addEventListener('click', function(e) {
    try {
        // Handle path card buttons
        if (e.target.matches('.path-card .btn')) {
            e.preventDefault();
            const cardTitle = e.target.closest('.path-card').querySelector('h3').textContent;
            alert(`Welcome to ${cardTitle}! This would normally redirect to the signup/onboarding flow.`);
        }

        // Handle quick option buttons
        if (e.target.matches('.quick-option')) {
            e.preventDefault();
            const optionTitle = e.target.querySelector('.option-title').textContent;
            alert(`${optionTitle} selected! This would normally open the respective feature.`);
        }

        // Handle CTA buttons
        if (e.target.matches('.final-cta .btn-primary')) {
            e.preventDefault();
            alert('Thank you for your interest! This would normally open the registration form.');
        }

        // Handle run button in code editor
        if (e.target.matches('.run-btn')) {
            e.preventDefault();
            e.target.textContent = 'Running...';
            e.target.style.background = '#ffc107';
            
            setTimeout(() => {
                e.target.textContent = 'Run';
                e.target.style.background = '#28a745';
                
                // Show output in console (simulated)
                console.log('Hello PocketGNU!');
                
                // Show a brief success indicator
                const originalText = e.target.textContent;
                e.target.textContent = '✓ Done';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 1000);
            }, 1500);
        }

    } catch(error) {
        console.error('Click handler error:', error);
    }
});

// Stats Animation on Scroll
function initStatsAnimation() {
    try {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = target.textContent;
                    
                    // Simple counter animation
                    if (finalValue.includes('K')) {
                        const numValue = parseFloat(finalValue) * 1000;
                        animateNumber(target, 0, numValue, 2000, (val) => {
                            return val >= 1000 ? (val/1000).toFixed(1) + 'K' : val.toString();
                        });
                    } else if (finalValue.includes('+')) {
                        const numValue = parseInt(finalValue);
                        animateNumber(target, 0, numValue, 2000, (val) => val + '+');
                    } else if (finalValue.includes('%')) {
                        const numValue = parseFloat(finalValue);
                        animateNumber(target, 0, numValue, 2000, (val) => val.toFixed(1) + '%');
                    }
                    
                    observer.unobserve(target);
                }
            });
        });

        statNumbers.forEach(stat => observer.observe(stat));

    } catch(error) {
        console.error('Stats animation error:', error);
    }
}

function animateNumber(element, start, end, duration, formatter) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * progress;
        element.textContent = formatter ? formatter(Math.floor(current)) : Math.floor(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Initialize stats animation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initStatsAnimation, 1000);
});

// Error handling for missing elements
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Fallback for browsers without JavaScript
if (typeof document === 'undefined') {
    console.warn('JavaScript is disabled. Some features may not work properly.');
}
