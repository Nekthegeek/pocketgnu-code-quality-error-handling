// Centralized Error Management System for PocketGNU
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 50; // Keep last 50 errors
        this.init();
    }

    init() {
        // Global error handler for uncaught errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        // Global handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'Unhandled Promise Rejection',
                message: event.reason ? event.reason.toString() : 'Unknown promise rejection',
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        });

        console.log('✅ Error Handler initialized successfully');
    }

    logError(errorInfo) {
        // Add to internal error log
        this.errors.push(errorInfo);
        
        // Keep only the last maxErrors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console with formatting
        console.group(`🚨 ${errorInfo.type}`);
        console.error('Message:', errorInfo.message);
        console.error('Timestamp:', errorInfo.timestamp);
        if (errorInfo.filename) {
            console.error('File:', `${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}`);
        }
        if (errorInfo.stack) {
            console.error('Stack:', errorInfo.stack);
        }
        if (errorInfo.retryContext) {
            console.error('Retry Context:', errorInfo.retryContext);
        }
        console.groupEnd();

        // Store in localStorage for persistence
        this.saveToLocalStorage(errorInfo);

        // In production, you would send this to a monitoring service
        // this.sendToMonitoringService(errorInfo);
    }

    saveToLocalStorage(errorInfo) {
        try {
            const existingErrors = JSON.parse(localStorage.getItem('pocketgnu_errors') || '[]');
            existingErrors.push(errorInfo);
            
            // Keep only last 20 errors in localStorage
            if (existingErrors.length > 20) {
                existingErrors.splice(0, existingErrors.length - 20);
            }
            
            localStorage.setItem('pocketgnu_errors', JSON.stringify(existingErrors));
        } catch (e) {
            console.warn('Failed to save error to localStorage:', e);
        }
    }

    // Method to manually log custom errors
    logCustomError(message, context = {}) {
        this.logError({
            type: 'Custom Error',
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    // Method to log retry attempts
    logRetryAttempt(retryInfo) {
        const retryLog = {
            type: 'Retry Attempt',
            message: `Retry attempt ${retryInfo.attempt} for ${retryInfo.context}`,
            retryContext: retryInfo,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.logError(retryLog);
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.errors.slice(-5)
        };

        this.errors.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    // Clear error log
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('pocketgnu_errors');
        console.log('✅ Error log cleared');
    }

    // Method to send errors to monitoring service (placeholder)
    sendToMonitoringService(errorInfo) {
        // In production, implement actual error reporting
        // Example: send to Sentry, LogRocket, or custom endpoint
        /*
        fetch('/api/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorInfo)
        }).catch(err => {
            console.warn('Failed to send error to monitoring service:', err);
        });
        */
    }
}

// Create global error handler instance
window.PocketGNUErrorHandler = new ErrorHandler();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
