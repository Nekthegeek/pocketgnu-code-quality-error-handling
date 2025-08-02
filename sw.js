// Service Worker for PocketGNU - Phase 2 Performance Optimization
const CACHE_NAME = 'pocketgnu-v1.0.0';
const STATIC_CACHE = 'pocketgnu-static-v1.0.0';
const DYNAMIC_CACHE = 'pocketgnu-dynamic-v1.0.0';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/css/critical.css',
    '/js/errorHandler.js',
    '/js/utils.js',
    '/js/scripts.js'
];

// Non-critical resources to cache on demand
const STATIC_RESOURCES = [
    '/css/styles.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// Resource patterns and their cache strategies
const CACHE_PATTERNS = [
    { pattern: /\.(?:js|css)$/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
    { pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
    { pattern: /^https:\/\/fonts\.googleapis\.com/, strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE },
    { pattern: /^https:\/\/fonts\.gstatic\.com/, strategy: CACHE_STRATEGIES.CACHE_FIRST }
];

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            networkRequests: 0,
            errors: 0
        };
    }

    recordCacheHit() {
        this.metrics.cacheHits++;
        this.logMetric('Cache Hit', this.metrics.cacheHits);
    }

    recordCacheMiss() {
        this.metrics.cacheMisses++;
        this.logMetric('Cache Miss', this.metrics.cacheMisses);
    }

    recordNetworkRequest() {
        this.metrics.networkRequests++;
        this.logMetric('Network Request', this.metrics.networkRequests);
    }

    recordError(error) {
        this.metrics.errors++;
        console.error('SW Error:', error);
    }

    logMetric(type, count) {
        console.log(`📊 SW ${type}: ${count}`);
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

const performanceMonitor = new PerformanceMonitor();

// Install event - Cache critical resources
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources
            caches.open(STATIC_CACHE).then(cache => {
                console.log('📦 Caching critical resources...');
                return cache.addAll(CRITICAL_RESOURCES);
            }),
            // Preload non-critical resources
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('📦 Preloading static resources...');
                return Promise.allSettled(
                    STATIC_RESOURCES.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            return null;
                        })
                    )
                );
            })
        ]).then(() => {
            console.log('✅ Service Worker installed successfully');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        }).catch(error => {
            console.error('❌ Service Worker installation failed:', error);
            performanceMonitor.recordError(error);
        })
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            // Take control of all clients immediately
            return self.clients.claim();
        }).catch(error => {
            console.error('❌ Service Worker activation failed:', error);
            performanceMonitor.recordError(error);
        })
    );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Determine cache strategy based on URL pattern
    const strategy = getCacheStrategy(request.url);
    
    event.respondWith(
        handleRequest(request, strategy)
            .catch(error => {
                console.error('Fetch error:', error);
                performanceMonitor.recordError(error);
                return new Response('Network error', { 
                    status: 408,
                    statusText: 'Request Timeout' 
                });
            })
    );
});

// Get cache strategy for a given URL
function getCacheStrategy(url) {
    for (const { pattern, strategy } of CACHE_PATTERNS) {
        if (pattern.test(url)) {
            return strategy;
        }
    }
    // Default strategy for unmatched URLs
    return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Handle request based on cache strategy
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);
        case CACHE_STRATEGIES.CACHE_ONLY:
            return cacheOnly(request);
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return networkOnly(request);
        default:
            return networkFirst(request);
    }
}

// Cache First Strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        performanceMonitor.recordCacheHit();
        return cachedResponse;
    }

    performanceMonitor.recordCacheMiss();
    performanceMonitor.recordNetworkRequest();
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// Network First Strategy
async function networkFirst(request) {
    try {
        performanceMonitor.recordNetworkRequest();
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            performanceMonitor.recordCacheHit();
            return cachedResponse;
        }
        
        performanceMonitor.recordCacheMiss();
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    // Always try to fetch fresh content in background
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(error => {
        console.warn('Background fetch failed:', error);
        return null;
    });

    // Return cached version immediately if available
    if (cachedResponse) {
        performanceMonitor.recordCacheHit();
        // Update cache in background
        fetchPromise;
        return cachedResponse;
    }

    // If no cache, wait for network
    performanceMonitor.recordCacheMiss();
    performanceMonitor.recordNetworkRequest();
    return fetchPromise;
}

// Cache Only Strategy
async function cacheOnly(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        performanceMonitor.recordCacheHit();
        return cachedResponse;
    }
    
    performanceMonitor.recordCacheMiss();
    throw new Error('Resource not in cache');
}

// Network Only Strategy
async function networkOnly(request) {
    performanceMonitor.recordNetworkRequest();
    return fetch(request);
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'GET_METRICS':
            event.ports[0].postMessage({
                type: 'METRICS_RESPONSE',
                payload: performanceMonitor.getMetrics()
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    payload: { success: true }
                });
            }).catch(error => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    payload: { success: false, error: error.message }
                });
            });
            break;
            
        case 'PREFETCH_RESOURCES':
            if (payload && payload.urls) {
                prefetchResources(payload.urls).then(results => {
                    event.ports[0].postMessage({
                        type: 'PREFETCH_COMPLETE',
                        payload: { results }
                    });
                });
            }
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Prefetch resources
async function prefetchResources(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const results = await Promise.allSettled(
        urls.map(url => cache.add(url))
    );
    
    return results.map((result, index) => ({
        url: urls[index],
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason.message : null
    }));
}

// Periodic cleanup of old cache entries
self.addEventListener('periodicsync', event => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(performCacheCleanup());
    }
});

// Perform cache cleanup
async function performCacheCleanup() {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const cleanupPromises = requests.map(async request => {
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (now - responseDate > maxAge) {
                console.log('🗑️ Cleaning up old cache entry:', request.url);
                return cache.delete(request);
            }
        }
    });
    
    await Promise.all(cleanupPromises);
    console.log('✅ Cache cleanup completed');
}

console.log('📱 PocketGNU Service Worker loaded');
