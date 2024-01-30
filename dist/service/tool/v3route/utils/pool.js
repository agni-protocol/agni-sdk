"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenPrice = exports.getPoolAddress = exports.computeV2PoolAddress = exports.computeV3PoolAddress = exports.getOutputCurrency = exports.involvesCurrency = exports.isV3Pool = exports.isV2Pool = void 0;
const memoize_js_1 = __importDefault(require("lodash/memoize.js"));
const vo_1 = require("../../../vo");
const sdk_1 = require("../../sdk");
const v2_1 = require("../../sdk/v2");
const v3_1 = require("../../sdk/v3");
const api_1 = require("../../../api");
function isV2Pool(pool) {
    return pool.type === vo_1.PoolType.V2;
}
exports.isV2Pool = isV2Pool;
function isV3Pool(pool) {
    return pool.type === vo_1.PoolType.V3;
}
exports.isV3Pool = isV3Pool;
function involvesCurrency(pool, currency) {
    const token = currency.wrapped;
    if (isV2Pool(pool)) {
        const { reserve0, reserve1 } = pool;
        return reserve0.currency.equals(token) || reserve1.currency.equals(token);
    }
    if (isV3Pool(pool)) {
        const { token0, token1 } = pool;
        return token0.equals(token) || token1.equals(token);
    }
    return false;
}
exports.involvesCurrency = involvesCurrency;
// FIXME current verison is not working with stable pools that have more than 2 tokens
function getOutputCurrency(pool, currencyIn) {
    const tokenIn = currencyIn.wrapped;
    if (isV2Pool(pool)) {
        const { reserve0, reserve1 } = pool;
        return reserve0.currency.equals(tokenIn) ? reserve1.currency : reserve0.currency;
    }
    if (isV3Pool(pool)) {
        const { token0, token1 } = pool;
        return token0.equals(tokenIn) ? token1 : token0;
    }
    throw new Error('Cannot get output currency by invalid pool');
}
exports.getOutputCurrency = getOutputCurrency;
exports.computeV3PoolAddress = (0, memoize_js_1.default)((tokenA, tokenB, fee) => {
    return api_1.PoolV3Api.computePoolAddress(tokenA, tokenB, fee);
}, (tokenA, tokenB, fee) => `${tokenA.chainId}_${tokenA.address}_${tokenB.address}_${fee}`);
exports.computeV2PoolAddress = (0, memoize_js_1.default)(v2_1.Pair.getAddress, (tokenA, tokenB) => `${tokenA.chainId}_${tokenA.address}_${tokenB.address}`);
exports.getPoolAddress = (0, memoize_js_1.default)(function getAddress(pool) {
    if (isV3Pool(pool)) {
        return pool.address;
    }
    if (isV2Pool(pool)) {
        const { reserve0, reserve1 } = pool;
        return (0, exports.computeV2PoolAddress)(reserve0.currency.wrapped, reserve1.currency.wrapped);
    }
    return '';
}, (pool) => {
    const [token0, token1] = isV2Pool(pool)
        ? [pool.reserve0.currency.wrapped, pool.reserve1.currency.wrapped]
        : [pool.token0.wrapped, pool.token1.wrapped];
    return `${pool.type}_${token0.chainId}_${token0.address}_${token1.address}`;
});
function getTokenPrice(pool, base, quote) {
    if (isV3Pool(pool)) {
        const { token0, token1, fee, liquidity, sqrtRatioX96, tick } = pool;
        const v3Pool = new v3_1.Pool(token0.wrapped, token1.wrapped, fee, sqrtRatioX96, liquidity, tick);
        return v3Pool.priceOf(base.wrapped);
    }
    if (isV2Pool(pool)) {
        const pair = new v2_1.Pair(pool.reserve0.wrapped, pool.reserve1.wrapped);
        return pair.priceOf(base.wrapped);
    }
    return new sdk_1.Price(base, quote, 1n, 0n);
}
exports.getTokenPrice = getTokenPrice;
