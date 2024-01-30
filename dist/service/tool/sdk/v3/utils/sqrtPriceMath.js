"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqrtPriceMath = void 0;
const internalConstants_1 = require("../internalConstants");
const constants_1 = require("../../constants");
const Common_1 = require("../../../math/Common");
const fullMath_1 = require("./fullMath");
const MaxUint160 = 2n ** 160n - internalConstants_1.ONE;
function multiplyIn256(x, y) {
    const product = x * y;
    return product & constants_1.MaxUint256;
}
function addIn256(x, y) {
    const sum = x + y;
    return sum & constants_1.MaxUint256;
}
class SqrtPriceMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
        if (sqrtRatioAX96 > sqrtRatioBX96) {
            sqrtRatioAX96 = sqrtRatioBX96;
            sqrtRatioBX96 = sqrtRatioAX96;
        }
        const numerator1 = liquidity << 96n;
        const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;
        return roundUp
            ? fullMath_1.FullMath.mulDivRoundingUp(fullMath_1.FullMath.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), internalConstants_1.ONE, sqrtRatioAX96)
            : (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
    }
    static getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
        if (sqrtRatioAX96 > sqrtRatioBX96) {
            sqrtRatioAX96 = sqrtRatioBX96;
            sqrtRatioBX96 = sqrtRatioAX96;
        }
        return roundUp
            ? fullMath_1.FullMath.mulDivRoundingUp(liquidity, sqrtRatioBX96 - sqrtRatioAX96, internalConstants_1.Q96)
            : (liquidity * (sqrtRatioBX96 - sqrtRatioAX96)) / internalConstants_1.Q96;
    }
    static getNextSqrtPriceFromInput(sqrtPX96, liquidity, amountIn, zeroForOne) {
        (0, Common_1.invariant)(sqrtPX96 > internalConstants_1.ZERO);
        (0, Common_1.invariant)(liquidity > internalConstants_1.ZERO);
        return zeroForOne
            ? this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
            : this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
    }
    static getNextSqrtPriceFromOutput(sqrtPX96, liquidity, amountOut, zeroForOne) {
        (0, Common_1.invariant)(sqrtPX96 > internalConstants_1.ZERO);
        (0, Common_1.invariant)(liquidity > internalConstants_1.ZERO);
        return zeroForOne
            ? this.getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
            : this.getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
    }
    static getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amount, add) {
        if (amount === internalConstants_1.ZERO)
            return sqrtPX96;
        const numerator1 = liquidity << 96n;
        if (add) {
            const product = multiplyIn256(amount, sqrtPX96);
            if (product / amount === sqrtPX96) {
                const denominator = addIn256(numerator1, product);
                if (denominator >= numerator1)
                    return fullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator);
            }
            return fullMath_1.FullMath.mulDivRoundingUp(numerator1, internalConstants_1.ONE, numerator1 / sqrtPX96 + amount);
        }
        const product = multiplyIn256(amount, sqrtPX96);
        (0, Common_1.invariant)(product / amount === sqrtPX96);
        (0, Common_1.invariant)(numerator1 > product);
        const denominator = numerator1 - product;
        return fullMath_1.FullMath.mulDivRoundingUp(numerator1, sqrtPX96, denominator);
    }
    static getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amount, add) {
        if (add) {
            const quotient = amount <= MaxUint160 ? (amount << 96n) / liquidity : (amount * internalConstants_1.Q96) / liquidity;
            return sqrtPX96 + quotient;
        }
        const quotient = fullMath_1.FullMath.mulDivRoundingUp(amount, internalConstants_1.Q96, liquidity);
        (0, Common_1.invariant)(sqrtPX96 > quotient);
        return sqrtPX96 - quotient;
    }
}
exports.SqrtPriceMath = SqrtPriceMath;
