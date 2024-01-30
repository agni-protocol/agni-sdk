"use strict";
// ERROR 栈
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxy = exports.mixProxyByConnect = exports.mixProxy = exports.errorHandlerController = exports.registerTransactionErrorHandler = exports.ErrorInfo = void 0;
const template_1 = __importDefault(require("lodash/template"));
const ethers_1 = require("ethers");
const BasicException_1 = require("../../BasicException");
const Tool_1 = require("./Tool");
const Cache_1 = require("./Cache");
class ErrorInfo {
}
exports.ErrorInfo = ErrorInfo;
let availableErrorHandler = (error) => {
    Tool_1.Trace.error('availableErrorHandler', error);
};
/**
 * 注册 交易异常处理回调
 * @param errorHandler
 */
function registerTransactionErrorHandler(errorHandler) {
    availableErrorHandler = errorHandler;
}
exports.registerTransactionErrorHandler = registerTransactionErrorHandler;
/**
 * 异常处理控制器
 * @param e
 * @param method
 * @param args
 * @param target
 */
function errorHandlerController(e, method, args, target) {
    try {
        const errorInfo = new ErrorInfo();
        errorInfo.error = e;
        errorInfo.method = method;
        try {
            errorInfo.args = JSON.stringify(args);
        }
        catch (e) {
            errorInfo.args = args;
        }
        errorInfo.target = target;
        if (e instanceof BasicException_1.BasicException)
            errorInfo.msg = e.msg;
        else
            errorInfo.msg = e.toString();
        availableErrorHandler(errorInfo);
    }
    catch (e) {
        Tool_1.Trace.error(e);
    }
}
exports.errorHandlerController = errorHandlerController;
function mixProxy(clazz, ...args) {
    return mixProxyByConnect(clazz, null, ...args);
}
exports.mixProxy = mixProxy;
function mixProxyByConnect(clazz, connectInfo, ...args) {
    const cacheKey = clazz.CACHE_KEY;
    if (!cacheKey)
        throw new BasicException_1.BasicException('clazz must have CACHE_KEY');
    try {
        const key = `${connectInfo && connectInfo.writeState ? "CONNECT_INFO" : "MIX_PROXY"}_${cacheKey}_${JSON.stringify(args)}`;
        const element = (0, Cache_1.getCache)().getByCreate(key, () => {
            const arg = connectInfo ? [connectInfo, ...args] : args;
            const instance = createProxy(new clazz(...arg));
            return [instance, Cache_1.Cache.ETERNITY_TTL];
        });
        return element;
    }
    catch (e) {
        Tool_1.Trace.error("mixProxy", cacheKey, connectInfo, args, e);
        throw e;
    }
}
exports.mixProxyByConnect = mixProxyByConnect;
/**
 * 对象代理
 * @param obj
 */
function createProxy(obj) {
    return new Proxy(obj, {
        get(target, propKey) {
            const ins = Reflect.get(target, propKey);
            if (ins instanceof ethers_1.Contract)
                return ins;
            if (ins && (ins.proxyEnable || ins.logEnable || ins.methodCache)) {
                return function () {
                    // eslint-disable-next-line prefer-rest-params
                    const args = arguments;
                    const showError = (err) => {
                        if (ins.proxyEnable)
                            errorHandlerController(err, propKey, args, target);
                        if (ins.logEnable) {
                            errorHandlerController(err, propKey, args, target);
                            Tool_1.Trace.debug(`${target.constructor.CACHE_KEY}.${propKey}`, 'args=', args, 'error', err);
                        }
                    };
                    const showLog = (data) => {
                        if (ins.logEnable) {
                            Tool_1.Trace.debug(`${target.constructor.CACHE_KEY}.${propKey} `, 'args=', args, 'result', data);
                        }
                    };
                    const call = (saveCache = (data) => {
                        if (data) {
                            // ...do nothing
                        }
                    }) => {
                        const res = ins.apply(target, args);
                        if (res instanceof Promise) {
                            return new Promise((resolve, reject) => {
                                res
                                    .then((data) => {
                                    showLog(data);
                                    saveCache(data);
                                    resolve(data);
                                })
                                    .catch((err) => {
                                    showError(err);
                                    reject(err);
                                });
                            });
                        }
                        else {
                            showLog(res);
                            saveCache(res);
                            return res;
                        }
                    };
                    // 不能使用箭头函数，获取到的 arguments 不是请求的
                    try {
                        if (ins.methodCache) {
                            const ttl = ins.methodCacheTTL;
                            const compiled = (0, template_1.default)(ins.methodCacheKey);
                            const key = compiled(args);
                            const data = (0, Cache_1.getCache)().get(key);
                            if (data) {
                                Tool_1.Trace.debug('hit cache', key, data);
                                return Promise.resolve(data);
                            }
                            else {
                                Tool_1.Trace.debug('miss cache', key);
                            }
                            return call((v) => {
                                Tool_1.Trace.debug('save cache', key, v, ttl);
                                (0, Cache_1.getCache)().put(key, v, ttl);
                            });
                        }
                        else {
                            return call();
                        }
                    }
                    catch (err) {
                        showError(err);
                        throw err;
                    }
                };
            }
            else {
                // 非方法对象，直接返回
                return ins;
            }
        },
    });
}
exports.createProxy = createProxy;
