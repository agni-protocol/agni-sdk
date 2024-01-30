"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiquidityFromTick = exports.getLiquidityFromSqrtRatioX96 = exports.getAverageLiquidity = exports.getAmountsAtNewPrice = exports.getAmountsByLiquidityAndPrice = exports.getLiquidityByAmountsAndPrice = exports.getLiquidityBySingleAmount = exports.getDependentAmount = exports.getEstimatedLPFeeByAmounts = exports.getEstimatedLPFeeByAmountsWithProtocolFee = exports.getEstimatedLPFee = exports.getEstimatedLPFeeWithProtocolFee = exports.parseNumberToFraction = exports.FeeCalculator = void 0;
const internalConstants_1 = require("../internalConstants");
const fractions_1 = require("../../fractions");
const constants_1 = require("../../constants");
const Common_1 = require("../../../math/Common");
const tick_1 = require("../tick");
const tickList_1 = require("./tickList");
const positionMath_1 = require("./positionMath");
const tickMath_1 = require("./tickMath");
const maxLiquidityForAmounts_1 = require("./maxLiquidityForAmounts");
exports.FeeCalculator = {
    getEstimatedLPFee,
    getEstimatedLPFeeByAmounts,
    getLiquidityFromTick,
    getLiquidityFromSqrtRatioX96,
    getAverageLiquidity,
    getLiquidityBySingleAmount,
    getDependentAmount,
    getLiquidityByAmountsAndPrice,
    getAmountsByLiquidityAndPrice,
    getAmountsAtNewPrice,
};
function parseNumberToFraction(num, precision = 6) {
    if (Number.isNaN(num) || !Number.isFinite(num))
        return undefined;
    const scalar = 10 ** precision;
    return new fractions_1.Fraction(BigInt(Math.floor(num * scalar)), BigInt(scalar));
}
exports.parseNumberToFraction = parseNumberToFraction;
function getEstimatedLPFeeWithProtocolFee({ amount, currency, ...rest }) {
    return getEstimatedLPFeeByAmountsWithProtocolFee({
        ...rest,
        amountA: amount,
        amountB: fractions_1.CurrencyAmount.fromRawAmount(currency, constants_1.MaxUint256),
    });
}
exports.getEstimatedLPFeeWithProtocolFee = getEstimatedLPFeeWithProtocolFee;
function getEstimatedLPFee({ amount, currency, ...rest }) {
    return getEstimatedLPFeeByAmounts({
        ...rest,
        amountA: amount,
        amountB: fractions_1.CurrencyAmount.fromRawAmount(currency, constants_1.MaxUint256),
    });
}
exports.getEstimatedLPFee = getEstimatedLPFee;
function getEstimatedLPFeeByAmountsWithProtocolFee(options) {
    try {
        return tryGetEstimatedLPFeeByAmounts(options);
    }
    catch (e) {
        console.error(e);
        return new fractions_1.Fraction(constants_1.ZERO);
    }
}
exports.getEstimatedLPFeeByAmountsWithProtocolFee = getEstimatedLPFeeByAmountsWithProtocolFee;
function getEstimatedLPFeeByAmounts({ protocolFee = internalConstants_1.ZERO_PERCENT, ...rest }) {
    try {
        const fee = tryGetEstimatedLPFeeByAmounts(rest);
        return internalConstants_1.ONE_HUNDRED_PERCENT.subtract(protocolFee).multiply(fee).asFraction;
    }
    catch (e) {
        console.error(e);
        return new fractions_1.Fraction(constants_1.ZERO);
    }
}
exports.getEstimatedLPFeeByAmounts = getEstimatedLPFeeByAmounts;
function tryGetEstimatedLPFeeByAmounts({ amountA, amountB, volume24H, sqrtRatioX96, tickLower, tickUpper, mostActiveLiquidity, fee, insidePercentage = internalConstants_1.ONE_HUNDRED_PERCENT, }) {
    (0, Common_1.invariant)(!Number.isNaN(fee) && fee >= 0, 'INVALID_FEE');
    const tickCurrent = tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    if (tickCurrent < tickLower || tickCurrent > tickUpper)
        return new fractions_1.Fraction(constants_1.ZERO);
    const liquidity = exports.FeeCalculator.getLiquidityByAmountsAndPrice({
        amountA,
        amountB,
        tickUpper,
        tickLower,
        sqrtRatioX96,
    });
    const volumeInFraction = parseNumberToFraction(volume24H) || new fractions_1.Fraction(constants_1.ZERO);
    return insidePercentage
        .multiply(volumeInFraction.multiply(BigInt(fee)).multiply(liquidity))
        .divide(internalConstants_1.MAX_FEE * (liquidity + mostActiveLiquidity)).asFraction;
}
function getDependentAmount(options) {
    const { currency, amount, sqrtRatioX96, tickLower, tickUpper } = options;
    const currentTick = tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    const liquidity = exports.FeeCalculator.getLiquidityBySingleAmount(options);
    const isToken0 = currency.wrapped.sortsBefore(amount.currency.wrapped);
    const getTokenAmount = isToken0 ? positionMath_1.PositionMath.getToken0Amount : positionMath_1.PositionMath.getToken1Amount;
    return fractions_1.CurrencyAmount.fromRawAmount(currency, getTokenAmount(currentTick, tickLower, tickUpper, sqrtRatioX96, liquidity));
}
exports.getDependentAmount = getDependentAmount;
function getLiquidityBySingleAmount({ amount, currency, ...rest }) {
    return getLiquidityByAmountsAndPrice({
        amountA: amount,
        amountB: fractions_1.CurrencyAmount.fromRawAmount(currency, constants_1.MaxUint256),
        ...rest,
    });
}
exports.getLiquidityBySingleAmount = getLiquidityBySingleAmount;
function getLiquidityByAmountsAndPrice({ amountA, amountB, tickUpper, tickLower, sqrtRatioX96, }) {
    const isToken0 = amountA.currency.wrapped.sortsBefore(amountB.currency.wrapped);
    const [inputAmount0, inputAmount1] = isToken0
        ? [amountA.quotient, amountB.quotient]
        : [amountB.quotient, amountA.quotient];
    const sqrtRatioAX96 = tickMath_1.TickMath.getSqrtRatioAtTick(tickLower);
    const sqrtRatioBX96 = tickMath_1.TickMath.getSqrtRatioAtTick(tickUpper);
    return (0, maxLiquidityForAmounts_1.maxLiquidityForAmounts)(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, inputAmount0, inputAmount1, true);
}
exports.getLiquidityByAmountsAndPrice = getLiquidityByAmountsAndPrice;
function getAmountsByLiquidityAndPrice(options) {
    const { currencyA, currencyB, liquidity, sqrtRatioX96, tickLower, tickUpper } = options;
    const currentTick = tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    const isToken0 = currencyA.wrapped.sortsBefore(currencyB.wrapped);
    const adjustedAmount0 = positionMath_1.PositionMath.getToken0Amount(currentTick, tickLower, tickUpper, sqrtRatioX96, liquidity);
    const adjustedAmount1 = positionMath_1.PositionMath.getToken1Amount(currentTick, tickLower, tickUpper, sqrtRatioX96, liquidity);
    return [
        fractions_1.CurrencyAmount.fromRawAmount(currencyA, isToken0 ? adjustedAmount0 : adjustedAmount1),
        fractions_1.CurrencyAmount.fromRawAmount(currencyB, isToken0 ? adjustedAmount1 : adjustedAmount0),
    ];
}
exports.getAmountsByLiquidityAndPrice = getAmountsByLiquidityAndPrice;
function getAmountsAtNewPrice({ newSqrtRatioX96, ...rest }) {
    const { tickLower, tickUpper, amountA, amountB } = rest;
    const liquidity = exports.FeeCalculator.getLiquidityByAmountsAndPrice(rest);
    return exports.FeeCalculator.getAmountsByLiquidityAndPrice({
        liquidity,
        currencyA: amountA.currency,
        currencyB: amountB.currency,
        tickLower,
        tickUpper,
        sqrtRatioX96: newSqrtRatioX96,
    });
}
exports.getAmountsAtNewPrice = getAmountsAtNewPrice;
function getAverageLiquidity(ticks, tickSpacing, tickLower, tickUpper) {
    (0, Common_1.invariant)(tickLower <= tickUpper, 'INVALID_TICK_RANGE');
    tickList_1.TickList.validateList(ticks, tickSpacing);
    if (tickLower === tickUpper)
        return exports.FeeCalculator.getLiquidityFromTick(ticks, tickLower);
    const lowerOutOfBound = tickLower < ticks[0].index;
    let lastTick = lowerOutOfBound
        ? new tick_1.Tick({ index: tickMath_1.TickMath.MIN_TICK, liquidityNet: constants_1.ZERO, liquidityGross: constants_1.ZERO })
        : tickList_1.TickList.nextInitializedTick(ticks, tickLower, true);
    let currentTick = tickList_1.TickList.nextInitializedTick(ticks, tickLower, false);
    let currentL = lowerOutOfBound ? constants_1.ZERO : exports.FeeCalculator.getLiquidityFromTick(ticks, currentTick.index);
    let weightedL = constants_1.ZERO;
    const getWeightedLFromLastTickTo = (toTick) => currentL * BigInt(toTick - Math.max(lastTick.index, tickLower));
    while (currentTick.index < tickUpper) {
        weightedL += getWeightedLFromLastTickTo(currentTick.index);
        currentL += currentTick.liquidityNet;
        lastTick = currentTick;
        // Tick upper is out of initialized tick range
        if (currentTick.index === ticks[ticks.length - 1].index)
            break;
        currentTick = tickList_1.TickList.nextInitializedTick(ticks, currentTick.index, false);
    }
    weightedL += getWeightedLFromLastTickTo(tickUpper);
    return weightedL / BigInt(tickUpper - tickLower);
}
exports.getAverageLiquidity = getAverageLiquidity;
function getLiquidityFromSqrtRatioX96(ticks, sqrtRatioX96) {
    const tick = tickMath_1.TickMath.getTickAtSqrtRatio(sqrtRatioX96);
    return exports.FeeCalculator.getLiquidityFromTick(ticks, tick);
}
exports.getLiquidityFromSqrtRatioX96 = getLiquidityFromSqrtRatioX96;
function getLiquidityFromTick(ticks, tick) {
    // calculate a cumulative of liquidityNet from all ticks that poolTicks[i] <= tick
    let liquidity = constants_1.ZERO;
    if (!ticks?.length)
        return liquidity;
    if (tick < ticks[0].index || tick > ticks[ticks.length - 1].index)
        return liquidity;
    for (let i = 0; i < ticks.length - 1; ++i) {
        liquidity += ticks[i].liquidityNet;
        const lowerTick = ticks[i].index;
        const upperTick = ticks[i + 1]?.index;
        if (lowerTick <= tick && tick <= upperTick)
            break;
    }
    return liquidity;
}
exports.getLiquidityFromTick = getLiquidityFromTick;
