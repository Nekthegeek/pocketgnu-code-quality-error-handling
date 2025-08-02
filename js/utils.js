// Utility Functions for PocketGNU
class PocketGNUUtils {
    constructor() {
        this.errorHandler = window.PocketGNUErrorHandler;
    }

    // Safe DOM element selector with error handling
    safeQuerySelector(selector, context = document) {
        try {
            const element = context.querySelector(selector);
            if (!element) {
                this.errorHandler?.logCustomError(`Element not found: ${selector}`, { selector, context });
            }
            return element;
        } catch (error) {
            this.errorHandler?.logCustomError(`Query selector error: ${error.message}`, { selector, error });
            return null;
        }
    }

    // Safe DOM elements selector with error handling
    safeQuerySelectorAll(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            this.errorHandler?.logCustomError(`Query selector all error: ${error.message}`, { selector, error });
            return [];
        }
    }

    // Safe event listener attachment
    safeAddEventListener(element, event, handler, options = {}) {
        try {
            if (!element) {
                this.errorHandler?.logCustomError('Cannot add event listener: element is null', { event });
                return false;
            }

            const wrappedHandler = (e) => {
                try {
                    handler(e);
                } catch (error) {
                    this.errorHandler?.logCustomError(`Event handler error for ${event}`, { 
                        event, 
                        error: error.message,
                        stack: error.stack 
                    });
                }
            };

            element.addEventListener(event, wrappedHandler, options);
            return true;
        } catch (error) {
            this.errorHandler?.logCustomError(`Failed to add event listener: ${error.message}`, { event, error });
            return false;
        }
    }

    // Safe setTimeout with error handling
    safeSetTimeout(callback, delay) {
        return setTimeout(() => {
            try {
                callback();
            } catch (error) {
                this.errorHandler?.logCustomError(`Timeout callback error: ${error.message}`, { 
                    delay, 
                    error: error.message,
                    stack: error.stack 
                });
            }
        }, delay);
    }

    // Safe setInterval with error handling
    safeSetInterval(callback, interval) {
        return setInterval(() => {
            try {
                callback();
            } catch (error) {
                this.errorHandler?.logCustomError(`Interval callback error: ${error.message}`, { 
                    interval, 
                    error: error.message,
                    stack: error.stack 
                });
            }
        }, interval);
    }

    // Debounce function for performance optimization
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) {
                    try {
                        func(...args);
                    } catch (error) {
                        this.errorHandler?.logCustomError(`Debounced function error: ${error.message}`, { error });
                    }
                }
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                try {
                    func(...args);
                } catch (error) {
                    this.errorHandler?.logCustomError(`Immediate debounced function error: ${error.message}`, { error });
                }
            }
        };
    }

    // Throttle function for performance optimization
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                try {
                    func.apply(this, args);
                } catch (error) {
                    this.errorHandler?.logCustomError(`Throttled function error: ${error.message}`, { error });
                }
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Safe local storage operations
    safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            this.errorHandler?.logCustomError(`LocalStorage set error: ${error.message}`, { key, error });
            return false;
        }
    }

    safeLocalStorageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            this.errorHandler?.logCustomError(`LocalStorage get error: ${error.message}`, { key, error });
            return defaultValue;
        }
    }

    // Performance monitoring helper
    measurePerformance(name, func) {
        const startTime = performance.now();
        try {
            const result = func();
            const endTime = performance.now();
            console.log(`⏱️ ${name} took ${(endTime - startTime).toFixed(2)} milliseconds`);
            return result;
        } catch (error) {
            const endTime = performance.now();
            this.errorHandler?.logCustomError(`Performance measurement error in ${name}: ${error.message}`, { 
                name, 
                duration: endTime - startTime,
                error 
            });
            throw error;
        }
    }

    // Async function wrapper with error handling
    async safeAsync(asyncFunc, context = 'Unknown') {
        try {
            return await asyncFunc();
        } catch (error) {
            this.errorHandler?.logCustomError(`Async function error in ${context}: ${error.message}`, { 
                context, 
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
    }

    // Retry async function with exponential backoff and logging
    async safeAsyncRetry(asyncFunc, attempts = 3, delay = 1000, context = 'Unknown') {
        let lastError;
        for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
                return await asyncFunc();
            } catch (error) {
                lastError = error;
                this.errorHandler?.logRetryAttempt({
                    attempt,
                    delay,
                    context,
                    errorMessage: error.message,
                    stack: error.stack
                });
                // Exponential backoff delay
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
        this.errorHandler?.logCustomError(`All retry attempts failed in ${context}`, { error: lastError.message, stack: lastError.stack });
        throw lastError;
    }

    // Offline detection and event handling
    initOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('✅ Network status: Online');
            this.errorHandler?.logCustomError('Network status changed to online', { type: 'Network' });
            const offlineBanner = document.getElementById('offline-banner');
            if (offlineBanner) {
                offlineBanner.style.display = 'none';
            }
        });

        window.addEventListener('offline', () => {
            console.warn('⚠️ Network status: Offline');
            this.errorHandler?.logCustomError('Network status changed to offline', { type: 'Network' });
            const offlineBanner = document.getElementById('offline-banner');
            if (offlineBanner) {
                offlineBanner.style.display = 'block';
            }
        });
    }

    // Check if currently offline
    isOffline() {
        return !navigator.onLine;
    }

    // Feature detection helper
    supportsFeature(feature) {
        const features = {
            localStorage: () => {
                try {
                    const test = '__test__';
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            serviceWorker: () => 'serviceWorker' in navigator,
            intersectionObserver: () => 'IntersectionObserver' in window,
            webGL: () => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                } catch (e) {
                    return false;
                }
            },
            touchEvents: () => 'ontouchstart' in window,
            geolocation: () => 'geolocation' in navigator
        };

        return features[feature] ? features[feature]() : false;
    }

    // Validation helpers
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Animation frame helper with error handling
    safeRequestAnimationFrame(callback) {
        return requestAnimationFrame(() => {
            try {
                callback();
            } catch (error) {
                this.errorHandler?.logCustomError(`Animation frame callback error: ${error.message}`, { error });
            }
        });
    }
}

// Create global utils instance
window.PocketGNUUtils = new PocketGNUUtils();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PocketGNUUtils;
}

// Create global utils instance
window.PocketGNUUtils = new PocketGNUUtils();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PocketGNUUtils;
}
