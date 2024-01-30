"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteProviderFactory = void 0;
const types_1 = require("../../tool/v3route/types");
const tool_1 = require("../../tool");
const pool_1 = require("../../tool/v3route/utils/pool");
const V3QuoteProvider_1 = require("./V3QuoteProvider");
const V2QuoteProvider_1 = require("./V2QuoteProvider");
const MixedQuoteProvider_1 = require("./MixedQuoteProvider");
const BaseApi_1 = require("../BaseApi");
let QuoteProviderFactory = class QuoteProviderFactory {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    getRouteWithQuotesExactIn(routes, options) {
        const getRouteWithQuotes = this.createGetRouteWithQuotes(true);
        return getRouteWithQuotes(routes, options);
    }
    getRouteWithQuotesExactOut(routes, options) {
        const getRouteWithQuotes = this.createGetRouteWithQuotes(false);
        return getRouteWithQuotes(routes, options);
    }
    createGetRouteWithQuotes(isExactIn = true) {
        const v3QuoteProvider = (0, tool_1.mixProxy)(V3QuoteProvider_1.V3QuoteProvider);
        const v2QuoteProvider = (0, tool_1.mixProxy)(V2QuoteProvider_1.V2QuoteProvider);
        const mixedQuoteProvider = (0, tool_1.mixProxy)(MixedQuoteProvider_1.MixedQuoteProvider);
        const getOffChainQuotes = isExactIn
            ? (routes, options) => v2QuoteProvider.getRouteWithQuotesExactIn(routes, options)
            : (routes, options) => v2QuoteProvider.getRouteWithQuotesExactOut(routes, options);
        const getMixedRouteQuotes = isExactIn
            ? (routes, options) => mixedQuoteProvider.getRouteWithQuotesExactIn(routes, options)
            : (routes, options) => mixedQuoteProvider.getRouteWithQuotesExactOut(routes, options);
        const getV3Quotes = isExactIn
            ? (routes, options) => v3QuoteProvider.getRouteWithQuotesExactIn(routes, options)
            : (routes, options) => v3QuoteProvider.getRouteWithQuotesExactOut(routes, options);
        return async function getRoutesWithQuotes(routes, { gasModel }) {
            if (routes.length === 0) {
                return [];
            }
            const v3SingleHopRoutes = [];
            const v3MultihopRoutes = [];
            const mixedRoutesHaveV3Pool = [];
            const routesCanQuoteOffChain = [];
            for (const route of routes) {
                if (route.type === types_1.RouteType.V2) {
                    routesCanQuoteOffChain.push(route);
                    continue;
                }
                if (route.type === types_1.RouteType.V3) {
                    if (route.pools.length === 1) {
                        v3SingleHopRoutes.push(route);
                        continue;
                    }
                    v3MultihopRoutes.push(route);
                    continue;
                }
                const { pools } = route;
                if (pools.some((pool) => (0, pool_1.isV3Pool)(pool))) {
                    mixedRoutesHaveV3Pool.push(route);
                    continue;
                }
                routesCanQuoteOffChain.push(route);
            }
            const results = await Promise.allSettled([
                getOffChainQuotes(routesCanQuoteOffChain, { gasModel }),
                getMixedRouteQuotes(mixedRoutesHaveV3Pool, { gasModel }),
                getV3Quotes(v3SingleHopRoutes, { gasModel }),
                getV3Quotes(v3MultihopRoutes, { gasModel }),
            ]);
            if (results.every((result) => result.status === 'rejected')) {
                throw new Error(results.map((result) => result.reason).join(','));
            }
            return results
                .filter((result) => result.status === 'fulfilled')
                .reduce((acc, cur) => [...acc, ...cur.value], []);
        };
    }
};
exports.QuoteProviderFactory = QuoteProviderFactory;
exports.QuoteProviderFactory = QuoteProviderFactory = __decorate([
    (0, tool_1.CacheKey)('QuoteProviderFactory')
], QuoteProviderFactory);
