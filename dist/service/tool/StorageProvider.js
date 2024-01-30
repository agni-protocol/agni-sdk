"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageProvider = exports.STORAGE_KEY_TOKENS = exports.STORAGE_KEY_TOKEN_LIST = void 0;
const Tool_1 = require("./Tool");
let data = {};
exports.STORAGE_KEY_TOKEN_LIST = 'STORAGE_KEY_TOKEN_LIST';
exports.STORAGE_KEY_TOKENS = 'STORAGE_KEY_TOKENS';
class StorageProvider {
    constructor(type) {
        this.type = type;
    }
    get(key) {
        switch (this.type) {
            case 'web':
                return localStorage.getItem(key) || '';
            case 'node':
                return data[key] || '';
        }
        return '';
    }
    getArray(key) {
        const str = this.get(key);
        let dataList;
        if (str) {
            try {
                const data = JSON.parse(str);
                if (Array.isArray(data))
                    dataList = data;
            }
            catch (e) {
                Tool_1.Trace.debug('StorageProvider.getArray', e);
            }
        }
        return dataList;
    }
    getObj(key) {
        const str = this.get(key);
        let result = null;
        if (str) {
            try {
                const data = JSON.parse(str);
                if (!Array.isArray(data))
                    result = data;
            }
            catch (e) {
                Tool_1.Trace.debug('StorageProvider.getObj', e);
            }
        }
        return result;
    }
    set(key, value) {
        switch (this.type) {
            case 'web':
                localStorage.setItem(key, value);
                break;
            case 'node':
                data[key] = value;
                break;
        }
    }
    setJson(key, value) {
        this.set(key, JSON.stringify(value));
    }
    clearKey(key) {
        switch (this.type) {
            case 'web':
                localStorage.removeItem(key);
                break;
            case 'node':
                delete data[key];
                break;
        }
    }
    clear() {
        switch (this.type) {
            case 'web':
                localStorage.clear();
                break;
            case 'node':
                data = {};
                break;
        }
    }
}
exports.StorageProvider = StorageProvider;
