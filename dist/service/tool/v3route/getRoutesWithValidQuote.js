"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutesWithValidQuote = void 0;
const sdk_1 = require("../sdk");
const functions_1 = require("./functions");
async function getRoutesWithValidQuote({ amount, baseRoutes, distributionPercent, quoteProvider, tradeType, gasModel, }) {
    const [percents, amounts] = (0, functions_1.getAmountDistribution)(amount, distributionPercent);
    // 拼route
    const routesWithoutQuote = amounts.reduce((acc, curAmount, i) => [
        ...acc,
        ...baseRoutes.map(r => ({
            ...r,
            amount: curAmount,
            percent: percents[i],
        })),
    ], []);
    if (tradeType === sdk_1.TradeType.EXACT_INPUT) {
        return quoteProvider.getRouteWithQuotesExactIn(routesWithoutQuote, { gasModel });
    }
    else {
        return quoteProvider.getRouteWithQuotesExactOut(routesWithoutQuote, { gasModel });
    }
}
exports.getRoutesWithValidQuote = getRoutesWithValidQuote;
