"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = exports.clearCache = exports.Cache = void 0;
const Tool_1 = require("./Tool");
class Cache {
    constructor(ttl) {
        this.ttl = 0;
        this.data = {};
        this.ttl = ttl;
    }
    now() {
        return (new Date()).getTime();
    }
    nuke(key) {
        delete this.data[key];
        return this;
    }
    get(key) {
        let val = null;
        const obj = this.data[key];
        if (obj) {
            if (obj.expires === 0 || this.now() < obj.expires) {
                val = obj.val;
            }
            else {
                val = null;
                this.nuke(key);
            }
        }
        return val;
    }
    getByCreate(key, create) {
        let val = this.get(key);
        if (val) {
            return val;
        }
        else {
            const [v, ttl] = create();
            this.put(key, v, ttl);
            val = v;
        }
        return val;
    }
    del(key) {
        const oldVal = this.get(key);
        this.nuke(key);
        return oldVal;
    }
    put(key, val = null, ttl = 0) {
        if (ttl === 0)
            ttl = this.ttl;
        const expires = (ttl === 0) ? 0 : (this.now() + ttl);
        const oldVal = this.del(key);
        if (val !== null) {
            this.data[key] = {
                expires,
                val,
            };
        }
        return oldVal;
    }
}
exports.Cache = Cache;
Cache.DEFAULT_TTL = 10 * 1000;
Cache.ETERNITY_TTL = 100 * 365 * 24 * 60 * 60 * 1000;
let cache = new Cache(Cache.DEFAULT_TTL);
function clearCache() {
    cache = new Cache((Cache.DEFAULT_TTL));
    Tool_1.Trace.debug('clear cache');
}
exports.clearCache = clearCache;
function getCache() {
    return cache;
}
exports.getCache = getCache;
