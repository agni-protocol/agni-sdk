import type { FeeAmount } from '../../../../vo';
export declare abstract class SwapMath {
    /**
     * Cannot be constructed.
     */
    private constructor();
    static computeSwapStep(sqrtRatioCurrentX96: bigint, sqrtRatioTargetX96: bigint, liquidity: bigint, amountRemaining: bigint, feePips: FeeAmount): [bigint, bigint, bigint, bigint];
}
