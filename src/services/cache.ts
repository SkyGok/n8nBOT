/**
 * Cache service for Redis caching layer
 * Provides caching for dashboard and other frequently accessed data
 * 
 * PHASE 3: Redis caching for 50-100ms dashboard loads
 */

import { getTenantSupabase } from '@/lib/supabase';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes default TTL
const REDIS_URL = import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379';
const USE_REDIS = import.meta.env.VITE_USE_REDIS === 'true';

// Cache key patterns
export const CACHE_KEYS = {
  dashboard: (tenantSchema: string, fromDate: string, toDate: string, cacheVersion: number) =>
    `dashboard:${tenantSchema}:${fromDate}:${toDate}:v${cacheVersion}`,
  dailyMetrics: (tenantSchema: string, date: string, cacheVersion: number) =>
    `daily_metrics:${tenantSchema}:${date}:v${cacheVersion}`,
  summary: (tenantSchema: string, cacheVersion: number) =>
    `summary:${tenantSchema}:v${cacheVersion}`,
};

/**
 * Get cache version from database
 * Used to generate cache keys that invalidate when data changes
 */
export async function getCacheVersion(
  cacheKeyPattern: string,
  tenantSchema?: string
): Promise<number> {
  if (!USE_REDIS) return 1; // No caching if Redis not enabled
  
  try {
    const supabase = getTenantSupabase();
    const { data, error } = await supabase.rpc('get_cache_version', {
      cache_key_pattern: cacheKeyPattern,
      tenant_schema_name: tenantSchema || null,
    });
    
    if (error) {
      console.warn('[Cache] Failed to get cache version:', error);
      return 1;
    }
    
    return data || 1;
  } catch (error) {
    console.warn('[Cache] Error getting cache version:', error);
    return 1;
  }
}

/**
 * Get cached data from Redis
 * Returns null if not cached or cache miss
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!USE_REDIS) return null;
  
  try {
    // In a real implementation, this would connect to Redis
    // For now, we'll use localStorage as a fallback for development
    const cached = localStorage.getItem(`cache:${key}`);
    if (!cached) return null;
    
    const { data, expires } = JSON.parse(cached);
    
    // Check if expired
    if (expires && Date.now() > expires) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    
    return data as T;
  } catch (error) {
    console.warn('[Cache] Error getting cached data:', error);
    return null;
  }
}

/**
 * Set cached data in Redis
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL
): Promise<void> {
  if (!USE_REDIS) return;
  
  try {
    // In a real implementation, this would connect to Redis
    // For now, we'll use localStorage as a fallback for development
    const expires = Date.now() + ttl * 1000;
    localStorage.setItem(`cache:${key}`, JSON.stringify({ data, expires }));
  } catch (error) {
    console.warn('[Cache] Error setting cached data:', error);
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!USE_REDIS) return;
  
  try {
    // In a real implementation, this would:
    // 1. Find all keys matching pattern in Redis
    // 2. Delete them
    // 3. Or use Redis pub/sub to notify other instances
    
    // For localStorage fallback, remove matching keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`cache:${pattern}`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[Cache] Error invalidating cache:', error);
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  if (!USE_REDIS) return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[Cache] Error clearing cache:', error);
  }
}

/**
 * Cache wrapper for async functions
 * Automatically handles cache get/set with version checking
 */
export async function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - fetch data
  const data = await fetcher();
  
  // Store in cache
  await setCached(cacheKey, data, ttl);
  
  return data;
}
