"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestTrade = void 0;
const functions_1 = require("./functions");
const gasModel_1 = require("./gasModel");
const getRoutesWithValidQuote_1 = require("./getRoutesWithValidQuote");
const types_1 = require("./types");
const sdk_1 = require("../sdk");
const Tool_1 = require("../Tool");
async function getBestTrade(amount, currency, tradeType, config) {
    const bestRoutes = await getBestRoutes(amount, currency, tradeType, config);
    if (!bestRoutes || bestRoutes.outputAmount.equalTo(sdk_1.ZERO)) {
        throw new Error('Cannot find a valid swap route');
    }
    const { routes, gasEstimate, inputAmount, outputAmount } = bestRoutes;
    // TODO restrict trade type to exact input if routes include one of the old
    // stable swap pools, which only allow to swap with exact input
    return {
        tradeType,
        routes,
        gasEstimate,
        inputAmount,
        outputAmount,
    };
}
exports.getBestTrade = getBestTrade;
// TODO distributionPercent 可以用来减少的路由的小额的多种情况,Pancake配置的5，但是因为RPC限流的问题，不得不减少RPC的请求，所以这里改成了25，配置必须是 5 的倍数，且能被100整除
async function getBestRoutes(amount, currency, tradeType, routeConfig) {
    const { maxHops = 3, maxSplits = 4, distributionPercent = 50, poolProvider, quoteProvider, gasPriceWei, allowedPoolTypes, } = routeConfig;
    const isExactIn = tradeType === sdk_1.TradeType.EXACT_INPUT;
    const inputCurrency = isExactIn ? amount.currency : currency;
    const outputCurrency = isExactIn ? currency : amount.currency;
    const candidatePools = await poolProvider.getCandidatePools({
        currencyA: amount.currency,
        currencyB: currency,
        protocols: allowedPoolTypes,
    });
    let baseRoutes = (0, functions_1.computeAllRoutes)(inputCurrency, outputCurrency, candidatePools, maxHops);
    // Do not support mix route on exact output
    if (tradeType === sdk_1.TradeType.EXACT_OUTPUT) {
        baseRoutes = baseRoutes.filter(({ type }) => type !== types_1.RouteType.MIXED);
    }
    const gasModel = await (0, gasModel_1.createGasModel)({ gasPriceWei, quoteCurrency: currency });
    const routesWithValidQuote = await (0, getRoutesWithValidQuote_1.getRoutesWithValidQuote)({
        amount,
        baseRoutes,
        distributionPercent,
        quoteProvider,
        tradeType,
        gasModel,
    });
    // TODO DEBUG ROUTE
    routesWithValidQuote.forEach(({ percent, path, amount: a, quote }) => {
        const pathStr = path.map(t => t.symbol).join('->');
        Tool_1.Trace.debug(`${percent}% Swap`, a.toExact(), a.currency.symbol, 'through', pathStr, ':', quote.toExact(), quote.currency.symbol);
    });
    return (0, functions_1.getBestRouteCombinationByQuotes)(amount, currency, routesWithValidQuote, tradeType, { maxSplits });
}
