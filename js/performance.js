// Performance Monitoring and Optimization Module - Phase 2
class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            loadTime: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            resourceLoadTimes: new Map(),
            memoryUsage: null,
            networkInfo: null
        };
        
        this.observers = new Map();
        this.lazyImages = new Set();
        this.lazyComponents = new Set();
        this.intersectionObserver = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
        } else {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        this.measureCoreWebVitals();
        this.setupResourceObserver();
        this.setupMemoryMonitoring();
        this.setupNetworkMonitoring();
        this.initLazyLoading();
        this.optimizeFonts();
        this.preloadCriticalResources();
        
        console.log('🚀 Performance Optimizer initialized');
    }

    // Core Web Vitals Measurement
    measureCoreWebVitals() {
        // Performance Observer for various metrics
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.largestContentfulPaint = lastEntry.startTime;
                console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
            });
            
            try {
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported');
            }

            // First Input Delay (FID)
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                    console.log(`📊 FID: ${this.metrics.firstInputDelay.toFixed(2)}ms`);
                });
            });
            
            try {
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', fidObserver);
            } catch (e) {
                console.warn('FID observer not supported');
            }

            // Cumulative Layout Shift (CLS)
            const clsObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        this.metrics.cumulativeLayoutShift += entry.value;
                    }
                });
                console.log(`📊 CLS: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`);
            });
            
            try {
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', clsObserver);
            } catch (e) {
                console.warn('CLS observer not supported');
            }
        }

        // Navigation Timing API
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
                this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
                
                console.log(`📊 Load Time: ${this.metrics.loadTime.toFixed(2)}ms`);
                console.log(`📊 DOM Content Loaded: ${this.metrics.domContentLoaded.toFixed(2)}ms`);
            }

            // Paint Timing API
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                    console.log(`📊 First Paint: ${entry.startTime.toFixed(2)}ms`);
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                    console.log(`📊 First Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
                }
            });
        });
    }

    // Resource Loading Observer
    setupResourceObserver() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    const loadTime = entry.responseEnd - entry.startTime;
                    this.metrics.resourceLoadTimes.set(entry.name, {
                        loadTime,
                        size: entry.transferSize || 0,
                        type: this.getResourceType(entry.name)
                    });
                    
                    if (loadTime > 1000) {
                        console.warn(`⚠️ Slow resource: ${entry.name} (${loadTime.toFixed(2)}ms)`);
                    }
                });
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', resourceObserver);
            } catch (e) {
                console.warn('Resource observer not supported');
            }
        }
    }

    // Memory Usage Monitoring
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            const updateMemoryUsage = () => {
                this.metrics.memoryUsage = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                
                const usagePercent = (this.metrics.memoryUsage.used / this.metrics.memoryUsage.limit) * 100;
                if (usagePercent > 80) {
                    console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`);
                }
            };

            updateMemoryUsage();
            setInterval(updateMemoryUsage, 30000); // Check every 30 seconds
        }
    }

    // Network Information Monitoring
    setupNetworkMonitoring() {
        if ('connection' in navigator) {
            this.metrics.networkInfo = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };

            navigator.connection.addEventListener('change', () => {
                this.metrics.networkInfo.effectiveType = navigator.connection.effectiveType;
                this.metrics.networkInfo.downlink = navigator.connection.downlink;
                this.metrics.networkInfo.rtt = navigator.connection.rtt;
                
                console.log(`📶 Network changed: ${navigator.connection.effectiveType}`);
                this.adaptToNetworkConditions();
            });
        }
    }

    // Lazy Loading Implementation
    initLazyLoading() {
        // Intersection Observer for lazy loading
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Find and setup lazy images
        this.setupLazyImages();
        
        // Setup lazy components
        this.setupLazyComponents();
    }

    setupLazyImages() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => {
            this.lazyImages.add(img);
            this.intersectionObserver.observe(img);
        });
    }

    setupLazyComponents() {
        const components = document.querySelectorAll('[data-lazy-component]');
        components.forEach(component => {
            this.lazyComponents.add(component);
            this.intersectionObserver.observe(component);
        });
    }

    loadLazyElement(element) {
        if (element.tagName === 'IMG') {
            this.loadLazyImage(element);
        } else if (element.hasAttribute('data-lazy-component')) {
            this.loadLazyComponent(element);
        }
    }

    loadLazyImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            
            img.addEventListener('load', () => {
                img.classList.add('fade-in');
            });
        }
    }

    loadLazyComponent(element) {
        const componentType = element.getAttribute('data-lazy-component');
        
        switch (componentType) {
            case 'stats-animation':
                this.initStatsAnimation(element);
                break;
            case 'activity-feed':
                this.initActivityFeed(element);
                break;
            default:
                console.warn(`Unknown lazy component: ${componentType}`);
        }
        
        element.removeAttribute('data-lazy-component');
    }

    // Font Optimization
    optimizeFonts() {
        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = fontUrl;
            link.onload = function() {
                this.onload = null;
                this.rel = 'stylesheet';
            };
            document.head.appendChild(link);
        });
    }

    // Critical Resource Preloading
    preloadCriticalResources() {
        const criticalResources = [
            { href: '/js/errorHandler.js', as: 'script' },
            { href: '/js/utils.js', as: 'script' },
            { href: '/css/critical.css', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });
    }

    // Adapt UI based on network conditions
    adaptToNetworkConditions() {
        if (!this.metrics.networkInfo) return;

        const { effectiveType, saveData } = this.metrics.networkInfo;

        if (saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
            console.log('⚡ Enabling data saver mode');
            // Disable animations, reduce image quality, etc.
            document.body.classList.add('data-saver');
        } else {
            document.body.classList.remove('data-saver');
        }
    }

    // Initialize stats animation (placeholder)
    initStatsAnimation(element) {
        // Implement stats animation initialization here
        console.log('Initializing stats animation for', element);
    }

    // Initialize activity feed (placeholder)
    initActivityFeed(element) {
        // Implement activity feed initialization here
        console.log('Initializing activity feed for', element);
    }

    // Get resource type from URL
    getResourceType(url) {
        if (typeof url !== 'string') return 'unknown';
        if (url.match(/\.(js|mjs|cjs)$/)) return 'script';
        if (url.match(/\.(css)$/)) return 'style';
        if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        if (url.match(/\.(json)$/)) return 'json';
        if (url.match(/\.(html)$/)) return 'document';
        return 'other';
    }

    // Get performance metrics
    getMetrics() {
        return {
            ...this.metrics,
            resourceLoadTimes: Object.fromEntries(this.metrics.resourceLoadTimes)
        };
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Initialize and expose globally
window.PocketGNUPerformanceOptimizer = new PerformanceOptimizer();
