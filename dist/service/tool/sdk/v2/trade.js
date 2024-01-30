"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTradeBetter = void 0;
const constants_1 = require("./constants");
// returns whether tradeB is better than tradeA by at least a threshold percentage amount
function isTradeBetter(tradeA, tradeB, minimumDelta = constants_1.ZERO_PERCENT) {
    if (tradeA && !tradeB)
        return false;
    if (tradeB && !tradeA)
        return true;
    if (!tradeA || !tradeB)
        return undefined;
    if (tradeA.tradeType !== tradeB.tradeType ||
        !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
        !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency)) {
        throw new Error('Trades are not comparable');
    }
    if (minimumDelta.equalTo(constants_1.ZERO_PERCENT)) {
        return tradeA.executionPrice.lessThan(tradeB.executionPrice);
    }
    return tradeA.executionPrice.asFraction
        .multiply(minimumDelta.add(constants_1.ONE_HUNDRED_PERCENT))
        .lessThan(tradeB.executionPrice);
}
exports.isTradeBetter = isTradeBetter;
exports.default = isTradeBetter;
