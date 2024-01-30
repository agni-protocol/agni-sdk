"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapMath = void 0;
const internalConstants_1 = require("../internalConstants");
const fullMath_1 = require("./fullMath");
const sqrtPriceMath_1 = require("./sqrtPriceMath");
class SwapMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static computeSwapStep(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, amountRemaining, feePips) {
        const returnValues = {};
        const zeroForOne = sqrtRatioCurrentX96 >= sqrtRatioTargetX96;
        const exactIn = amountRemaining >= internalConstants_1.ZERO;
        if (exactIn) {
            const amountRemainingLessFee = (amountRemaining * (internalConstants_1.MAX_FEE - BigInt(feePips))) / internalConstants_1.MAX_FEE;
            returnValues.amountIn = zeroForOne
                ? sqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
                : sqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);
            if (amountRemainingLessFee >= returnValues.amountIn) {
                returnValues.sqrtRatioNextX96 = sqrtRatioTargetX96;
            }
            else {
                returnValues.sqrtRatioNextX96 = sqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromInput(sqrtRatioCurrentX96, liquidity, amountRemainingLessFee, zeroForOne);
            }
        }
        else {
            returnValues.amountOut = zeroForOne
                ? sqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, false)
                : sqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, false);
            if (amountRemaining * internalConstants_1.NEGATIVE_ONE >= returnValues.amountOut) {
                returnValues.sqrtRatioNextX96 = sqrtRatioTargetX96;
            }
            else {
                returnValues.sqrtRatioNextX96 = sqrtPriceMath_1.SqrtPriceMath.getNextSqrtPriceFromOutput(sqrtRatioCurrentX96, liquidity, amountRemaining * internalConstants_1.NEGATIVE_ONE, zeroForOne);
            }
        }
        const max = sqrtRatioTargetX96 === returnValues.sqrtRatioNextX96;
        if (zeroForOne) {
            returnValues.amountIn
                = max && exactIn
                    ? returnValues.amountIn
                    : sqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(returnValues.sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true);
            returnValues.amountOut
                = max && !exactIn
                    ? returnValues.amountOut
                    : sqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(returnValues.sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false);
        }
        else {
            returnValues.amountIn
                = max && exactIn
                    ? returnValues.amountIn
                    : sqrtPriceMath_1.SqrtPriceMath.getAmount1Delta(sqrtRatioCurrentX96, returnValues.sqrtRatioNextX96, liquidity, true);
            returnValues.amountOut
                = max && !exactIn
                    ? returnValues.amountOut
                    : sqrtPriceMath_1.SqrtPriceMath.getAmount0Delta(sqrtRatioCurrentX96, returnValues.sqrtRatioNextX96, liquidity, false);
        }
        if (!exactIn && returnValues.amountOut > amountRemaining * internalConstants_1.NEGATIVE_ONE)
            returnValues.amountOut = amountRemaining * internalConstants_1.NEGATIVE_ONE;
        if (exactIn && returnValues.sqrtRatioNextX96 !== sqrtRatioTargetX96) {
            // we didn't reach the target, so take the remainder of the maximum input as fee
            returnValues.feeAmount = amountRemaining - returnValues.amountIn;
        }
        else {
            returnValues.feeAmount = fullMath_1.FullMath.mulDivRoundingUp(returnValues.amountIn, BigInt(feePips), internalConstants_1.MAX_FEE - BigInt(feePips));
        }
        return [returnValues.sqrtRatioNextX96, returnValues.amountIn, returnValues.amountOut, returnValues.feeAmount];
    }
}
exports.SwapMath = SwapMath;
