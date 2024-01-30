"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tickToPriceString = exports.computeSurroundingTicks = exports.validateAndParseAddress = exports.getTickToPrice = exports.tryParseTick = exports.tryParsePrice = exports.ENDLESS = exports.invariant = void 0;
const ethers_1 = require("ethers");
const sdk_1 = require("../sdk");
const vo_1 = require("../../vo");
const utils_1 = require("../sdk/v3/utils");
function invariant(state, errorMsg = 'ERROR') {
    if (!state)
        throw new Error(errorMsg);
}
exports.invariant = invariant;
exports.ENDLESS = '∞';
function tryParsePrice(baseToken, quoteToken, value) {
    if (!baseToken || !quoteToken || !value)
        return undefined;
    if (!value.match(/^\d*\.?\d+$/))
        return undefined;
    const [whole, fraction] = value.split('.');
    const decimals = fraction?.length ?? 0;
    const withoutDecimals = BigInt((whole ?? '') + (fraction ?? ''));
    return new sdk_1.Price(baseToken, quoteToken, BigInt(10 ** decimals) * BigInt(10 ** baseToken.decimals), withoutDecimals * BigInt(10 ** quoteToken.decimals));
}
exports.tryParsePrice = tryParsePrice;
function tryParseTick(baseToken, quoteToken, feeAmount, value) {
    if (!baseToken || !quoteToken || !feeAmount || !value)
        return undefined;
    const price = tryParsePrice(baseToken, quoteToken, value);
    if (!price)
        return undefined;
    let tick;
    // check price is within min/max bounds, if outside return min/max
    const sqrtRatioX96 = (0, utils_1.encodeSqrtRatioX96)(price.numerator, price.denominator);
    if (sqrtRatioX96 >= utils_1.TickMath.MAX_SQRT_RATIO) {
        tick = utils_1.TickMath.MAX_TICK;
    }
    else if (sqrtRatioX96 <= utils_1.TickMath.MIN_SQRT_RATIO) {
        tick = utils_1.TickMath.MIN_TICK;
    }
    else {
        // this function is agnostic to the base, will always return the correct tick
        tick = (0, utils_1.priceToClosestTick)(price);
    }
    return (0, utils_1.nearestUsableTick)(tick, vo_1.TICK_SPACINGS[feeAmount]);
}
exports.tryParseTick = tryParseTick;
function getTickToPrice(baseToken, quoteToken, tick) {
    if (!baseToken || !quoteToken || typeof tick !== 'number')
        return undefined;
    return (0, utils_1.tickToPrice)(baseToken, quoteToken, tick);
}
exports.getTickToPrice = getTickToPrice;
function validateAndParseAddress(address) {
    try {
        return (0, ethers_1.getAddress)(address);
    }
    catch (error) {
        invariant(false, `${address} is not a valid address.`);
    }
}
exports.validateAndParseAddress = validateAndParseAddress;
function computeSurroundingTicks(token0, token1, activeTickProcessed, sortedTickData, pivot, ascending) {
    let previousTickProcessed = {
        ...activeTickProcessed,
    };
    // Iterate outwards (either up or down depending on direction) from the active tick,
    // building active liquidity for every tick.
    let processedTicks = [];
    for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
        const tick = Number(sortedTickData[i].tick);
        const currentTickProcessed = {
            liquidityActive: previousTickProcessed.liquidityActive,
            tick,
            liquidityNet: BigInt(sortedTickData[i].liquidityNet),
            price0: (0, utils_1.tickToPrice)(token0, token1, tick).toFixed(),
        };
        // Update the active liquidity.
        // If we are iterating ascending and we found an initialized tick we immediately apply
        // it to the current processed tick we are building.
        // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
        if (ascending) {
            currentTickProcessed.liquidityActive
                = previousTickProcessed.liquidityActive + BigInt(sortedTickData[i].liquidityNet);
        }
        else if (!ascending && previousTickProcessed.liquidityNet !== 0n) {
            // We are iterating descending, so look at the previous tick and apply any net liquidity.
            currentTickProcessed.liquidityActive = previousTickProcessed.liquidityActive - previousTickProcessed.liquidityNet;
        }
        processedTicks.push(currentTickProcessed);
        previousTickProcessed = currentTickProcessed;
    }
    if (!ascending)
        processedTicks = processedTicks.reverse();
    return processedTicks;
}
exports.computeSurroundingTicks = computeSurroundingTicks;
function tickToPriceString(token0, token1, feeAmount, tick) {
    const min = (0, utils_1.nearestUsableTick)(utils_1.TickMath.MIN_TICK, vo_1.TICK_SPACINGS[feeAmount]);
    const max = (0, utils_1.nearestUsableTick)(utils_1.TickMath.MAX_TICK, vo_1.TICK_SPACINGS[feeAmount]);
    if (tick === min)
        return '0';
    if (tick === max)
        return exports.ENDLESS;
    return (0, utils_1.tickToPrice)(token0, token1, tick).toFixed();
}
exports.tickToPriceString = tickToPriceString;
