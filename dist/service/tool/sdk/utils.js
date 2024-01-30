"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenComparator = exports.computePriceImpact = exports.sortedInsert = exports.sqrt = exports.validateVMTypeInstance = void 0;
const Common_1 = require("../math/Common");
const constants_1 = require("./constants");
const fractions_1 = require("./fractions");
function validateVMTypeInstance(value, vmType) {
    (0, Common_1.invariant)(value >= constants_1.ZERO, `${value} is not a ${vmType}.`);
    (0, Common_1.invariant)(value <= constants_1.VM_TYPE_MAXIMA[vmType], `${value} is not a ${vmType}.`);
}
exports.validateVMTypeInstance = validateVMTypeInstance;
// mock the on-chain sqrt function
function sqrt(y) {
    (0, Common_1.invariant)(y >= constants_1.ZERO, 'NEGATIVE');
    let z = constants_1.ZERO;
    let x;
    if (y > constants_1.THREE) {
        z = y;
        x = y / constants_1.TWO + constants_1.ONE;
        while (x < z) {
            z = x;
            x = (y / x + x) / constants_1.TWO;
        }
    }
    else if (y !== constants_1.ZERO) {
        z = constants_1.ONE;
    }
    return z;
}
exports.sqrt = sqrt;
// given an array of items sorted by `comparator`, insert an item into its sort index and constrain the size to
// `maxSize` by removing the last item
function sortedInsert(items, add, maxSize, comparator) {
    (0, Common_1.invariant)(maxSize > 0, 'MAX_SIZE_ZERO');
    // this is an invariant because the interface cannot return multiple removed items if items.length exceeds maxSize
    (0, Common_1.invariant)(items.length <= maxSize, 'ITEMS_SIZE');
    // short circuit first item add
    if (items.length === 0) {
        items.push(add);
        return null;
    }
    else {
        const isFull = items.length === maxSize;
        // short circuit if full and the additional item does not come before the last item
        if (isFull && comparator(items[items.length - 1], add) <= 0)
            return add;
        let lo = 0;
        let hi = items.length;
        while (lo < hi) {
            const mid = (lo + hi) >>> 1;
            if (comparator(items[mid], add) <= 0)
                lo = mid + 1;
            else
                hi = mid;
        }
        items.splice(lo, 0, add);
        return isFull ? items.pop() : null;
    }
}
exports.sortedInsert = sortedInsert;
/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
function computePriceImpact(midPrice, inputAmount, outputAmount) {
    const quotedOutputAmount = midPrice.quote(inputAmount);
    // calculate price impact := (exactQuote - outputAmount) / exactQuote
    const priceImpact = quotedOutputAmount.subtract(outputAmount).divide(quotedOutputAmount);
    return new fractions_1.Percent(priceImpact.numerator, priceImpact.denominator);
}
exports.computePriceImpact = computePriceImpact;
// compare two token amounts with highest one coming first
function balanceComparator(balanceA, balanceB) {
    if (balanceA && balanceB)
        return balanceA.greaterThan(balanceB) ? -1 : balanceA.equalTo(balanceB) ? 0 : 1;
    if (balanceA && balanceA.greaterThan('0'))
        return -1;
    if (balanceB && balanceB.greaterThan('0'))
        return 1;
    return 0;
}
function getTokenComparator(balances) {
    return function sortTokens(tokenA, tokenB) {
        // -1 = a is first
        // 1 = b is first
        // sort by balances
        const balanceA = balances[tokenA.erc20Address()];
        const balanceB = balances[tokenB.erc20Address()];
        const balanceComp = balanceComparator(balanceA, balanceB);
        if (balanceComp !== 0)
            return balanceComp;
        if (tokenA.symbol && tokenB.symbol) {
            // sort by symbol
            return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1;
        }
        return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0;
    };
}
exports.getTokenComparator = getTokenComparator;
