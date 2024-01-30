"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimumAmountOut = exports.maximumAmountIn = void 0;
const sdk_1 = require("../../sdk");
function maximumAmountIn(trade, slippage, amountIn = trade.inputAmount) {
    if (trade.tradeType === sdk_1.TradeType.EXACT_INPUT) {
        return amountIn;
    }
    const slippageAdjustedAmountIn = new sdk_1.Fraction(sdk_1.ONE).add(slippage).multiply(amountIn.quotient).quotient;
    return sdk_1.CurrencyAmount.fromRawAmount(amountIn.currency, slippageAdjustedAmountIn);
}
exports.maximumAmountIn = maximumAmountIn;
function minimumAmountOut(trade, slippage, amountOut = trade.outputAmount) {
    if (trade.tradeType === sdk_1.TradeType.EXACT_OUTPUT) {
        return amountOut;
    }
    const slippageAdjustedAmountOut = new sdk_1.Fraction(sdk_1.ONE).add(slippage).invert().multiply(amountOut.quotient).quotient;
    return sdk_1.CurrencyAmount.fromRawAmount(amountOut.currency, slippageAdjustedAmountOut);
}
exports.minimumAmountOut = minimumAmountOut;
