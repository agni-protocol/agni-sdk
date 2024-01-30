"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmountDistribution = void 0;
const sdk_1 = require("../../sdk");
/**
 * The minimum percentage of the input token to use for each route in a split route.
 * All routes will have a multiple of this value. For example is distribution percentage is 5,
 * a potential return swap would be:
 *
 * 5% of input => Route 1
 * 55% of input => Route 2
 * 40% of input => Route 3
 */
function getAmountDistribution(amount, distributionPercent) {
    const percents = [];
    const amounts = [];
    for (let i = 1; i <= 100 / distributionPercent; i++) {
        // Note multiplications here can result in a loss of precision in the amounts (e.g. taking 50% of 101)
        // This is reconcilled at the end of the algorithm by adding any lost precision to one of
        // the splits in the route.
        percents.push(i * distributionPercent);
        amounts.push(amount.multiply(new sdk_1.Fraction(i * distributionPercent, 100)));
    }
    return [percents, amounts];
}
exports.getAmountDistribution = getAmountDistribution;
