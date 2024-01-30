"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodCache = exports.EnableLogs = exports.EnableProxy = exports.CacheKey = void 0;
/**
 * 增加 静态属性 方便对对象进行缓存
 * @param key
 * @constructor
 */
function CacheKey(key) {
    return function (target) {
        target.CACHE_KEY = key;
    };
}
exports.CacheKey = CacheKey;
/**
 * 对方法进行标记
 * @param key
 * @constructor
 */
function EnableProxy() {
    return function (target, propertyKey, descriptor) {
        target[propertyKey].proxyEnable = true;
    };
}
exports.EnableProxy = EnableProxy;
/**
 * 对方法进行标记,打印LOG
 * @param key
 * @constructor
 */
function EnableLogs() {
    return function (target, propertyKey, descriptor) {
        target[propertyKey].logEnable = true;
    };
}
exports.EnableLogs = EnableLogs;
/**
 * 方法缓存
 * @param key 缓存Key
 * @param ttl milliseconds
 * @constructor
 */
function MethodCache(key, ttl) {
    return function (target, propertyKey, descriptor) {
        target[propertyKey].methodCache = true;
        target[propertyKey].methodCacheKey = key;
        target[propertyKey].methodCacheTTL = ttl;
    };
}
exports.MethodCache = MethodCache;
