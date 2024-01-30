"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = exports.TraceTool = exports.isNumber = exports.getValue = exports.showApprove = exports.eqAddress = exports.calculateGasMargin = exports.retry = exports.isNullOrUndefined = exports.isNullOrBlank = exports.sleep = exports.convertAmount1 = exports.convertAmount = exports.convertBigNumber1 = exports.convertBigNumber = exports.MAXIMUM_U256 = exports.ADDRESS_THIS = exports.ONE_ADDRESS = exports.INVALID_ADDRESS = exports.ZERO_ADDRESS = exports.SLEEP_MS = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const get_1 = __importDefault(require("lodash/get"));
const BasicException_1 = require("../../BasicException");
/**
 * 轮询休眠时长 ms
 */
exports.SLEEP_MS = 1000;
/**
 * 0 地址
 */
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.INVALID_ADDRESS = '0x0000000000000000000000000000030000000000';
exports.ONE_ADDRESS = '0x0000000000000000000000000000000000000001';
exports.ADDRESS_THIS = '0x0000000000000000000000000000000000000002';
/**
 * uint(-1)
 */
exports.MAXIMUM_U256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
/**
 *  b / 1e18
 * @param bnAmount
 * @param precision
 */
function convertBigNumber(bnAmount, precision = 1e18) {
    return new bignumber_js_1.default(bnAmount).dividedBy(new bignumber_js_1.default(precision)).toFixed();
}
exports.convertBigNumber = convertBigNumber;
/**
 *  b / (10 ** decimals)
 * @param bnAmount
 * @param decimals
 */
function convertBigNumber1(bnAmount, decimals = 18) {
    return new bignumber_js_1.default(bnAmount).dividedBy(new bignumber_js_1.default('10').pow(decimals)).toFixed();
}
exports.convertBigNumber1 = convertBigNumber1;
/**
 * b * 1e18
 * @param bnAmount
 * @param precision
 */
function convertAmount(bnAmount, precision = 1e18) {
    return new bignumber_js_1.default(bnAmount).multipliedBy(new bignumber_js_1.default(precision)).toFixed();
}
exports.convertAmount = convertAmount;
/**
 * amount * (10 ** decimals)
 * @param amount
 * @param decimals
 */
function convertAmount1(amount, decimals = 18) {
    return new bignumber_js_1.default(amount).multipliedBy(new bignumber_js_1.default('10').pow(decimals)).toFixed();
}
exports.convertAmount1 = convertAmount1;
/**
 * 休眠指定时间
 * @param ms
 */
async function sleep(ms) {
    return await new Promise(resolve => setTimeout(() => {
        resolve(1);
    }, ms));
}
exports.sleep = sleep;
/**
 * 判断未空字符串
 * @param value
 */
function isNullOrBlank(value) {
    return isNullOrUndefined(value) || value === '' || value.length === 0;
}
exports.isNullOrBlank = isNullOrBlank;
/**
 * 判断Null Or Undefined
 * @param value
 */
function isNullOrUndefined(value) {
    return value === undefined || value === null;
}
exports.isNullOrUndefined = isNullOrUndefined;
/**
 * 重试
 * @param func
 * @param retryCount
 */
async function retry(func, retryCount = 3) {
    let count = retryCount;
    do {
        try {
            return await func();
        }
        catch (e) {
            // eslint-disable-next-line curly
            if (count > 0) {
                count--;
            }
            if (count <= 0)
                throw new BasicException_1.BasicException(e.toString(), e);
            console.error('retry', e);
            await sleep(exports.SLEEP_MS);
        }
    } while (true);
}
exports.retry = retry;
function calculateGasMargin(value) {
    return Number.parseInt(new bignumber_js_1.default(value).multipliedBy(1.2).toFixed(0, bignumber_js_1.default.ROUND_DOWN), 10);
}
exports.calculateGasMargin = calculateGasMargin;
function eqAddress(addr0, addr1) {
    return addr0.toLowerCase() === addr1.toLowerCase();
}
exports.eqAddress = eqAddress;
function showApprove(balanceInfo) {
    const amount = convertBigNumber1(balanceInfo.allowance, balanceInfo.decimals);
    return new bignumber_js_1.default(amount).comparedTo('100000000') <= 0;
}
exports.showApprove = showApprove;
function getValue(obj, path, defaultValue) {
    return (0, get_1.default)(obj, path, defaultValue) || defaultValue;
}
exports.getValue = getValue;
function isNumber(input) {
    const tempValue = new bignumber_js_1.default(input);
    return !(tempValue.isNaN()
        || !tempValue.isFinite()
        || tempValue.comparedTo(new bignumber_js_1.default('0')) < 0);
}
exports.isNumber = isNumber;
/**
 * 日志工具
 */
class TraceTool {
    constructor() {
        this.logShow = true;
        this.errorShow = true;
        this.debugShow = true;
    }
    setLogShow(b) {
        this.logShow = b;
    }
    setErrorShow(b) {
        this.errorShow = b;
    }
    setDebugShow(b) {
        this.debugShow = b;
    }
    log(...args) {
        console.log(...args);
    }
    print(...args) {
        if (this.logShow)
            this.log(...args);
    }
    error(...args) {
        if (this.errorShow)
            console.error(...args);
    }
    debug(...args) {
        if (this.debugShow)
            this.log(...args);
    }
}
exports.TraceTool = TraceTool;
exports.Trace = new TraceTool();
