"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2QuoteProvider = void 0;
const BaseApi_1 = require("../BaseApi");
const tool_1 = require("../../tool");
const pool_1 = require("../../tool/v3route/utils/pool");
const v2_1 = require("../../tool/sdk/v2");
let V2QuoteProvider = class V2QuoteProvider {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    createGetV2Quote(isExactIn = true) {
        return function getV2Quote({ reserve0, reserve1 }, amount) {
            const pair = new v2_1.Pair(reserve0.wrapped, reserve1.wrapped);
            const [quote] = isExactIn ? pair.getOutputAmount(amount.wrapped) : pair.getInputAmount(amount.wrapped);
            return quote;
        };
    }
    getRouteWithQuotesExactIn(routes, options) {
        const getRoutesWithQuotes = this.createGetRoutesWithQuotes(true);
        return getRoutesWithQuotes(routes, options);
    }
    getRouteWithQuotesExactOut(routes, options) {
        const getRoutesWithQuotes = this.createGetRoutesWithQuotes(false);
        return getRoutesWithQuotes(routes, options);
    }
    createGetRoutesWithQuotes(isExactIn = true) {
        const getV2Quote = this.createGetV2Quote(isExactIn);
        function* each(pools) {
            let i = isExactIn ? 0 : pools.length - 1;
            const hasNext = () => (isExactIn ? i < pools.length : i >= 0);
            while (hasNext()) {
                yield [pools[i], i];
                if (isExactIn) {
                    i += 1;
                }
                else {
                    i -= 1;
                }
            }
        }
        const adjustQuoteForGas = (quote, gasCostInToken) => {
            if (isExactIn) {
                return quote.subtract(gasCostInToken);
            }
            return quote.add(gasCostInToken);
        };
        return async function getRoutesWithQuotes(routes, { gasModel }) {
            const routesWithQuote = [];
            for (const route of routes) {
                try {
                    const { pools, amount } = route;
                    let quote = amount;
                    const initializedTickCrossedList = Array(pools.length).fill(0);
                    const quoteSuccess = true;
                    for (const [pool,] of each(pools)) {
                        if ((0, pool_1.isV2Pool)(pool)) {
                            quote = getV2Quote(pool, quote);
                            continue;
                        }
                        if ((0, pool_1.isV3Pool)(pool)) {
                            throw new Error('V3 pool is not supported');
                        }
                    }
                    if (!quoteSuccess) {
                        continue;
                    }
                    const { gasEstimate, gasCostInUSD, gasCostInToken } = gasModel.estimateGasCost(pools, initializedTickCrossedList);
                    routesWithQuote.push({
                        ...route,
                        quote,
                        quoteAdjustedForGas: adjustQuoteForGas(quote, gasCostInToken),
                        gasEstimate,
                        gasCostInUSD,
                        gasCostInToken,
                    });
                }
                catch (e) {
                    // console.warn('Failed to get quote from route', route, e)
                }
            }
            return routesWithQuote;
        };
    }
};
exports.V2QuoteProvider = V2QuoteProvider;
exports.V2QuoteProvider = V2QuoteProvider = __decorate([
    (0, tool_1.CacheKey)('V2QuoteProvider')
], V2QuoteProvider);
