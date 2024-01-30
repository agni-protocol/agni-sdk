import type { BalanceAndAllowance } from '../Types';
import type { TransactionEvent } from '../TransactionEvent';
import type { ConnectInfo } from '../../../ConnectInfo';
import type { TokenPrice } from '../tokenlist';
import type { Pool } from '../../tool/sdk/v3';
import { Token } from "../../tool/sdk";
/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
export declare enum FeeAmount {
    LOWEST = 100,
    LOW = 500,
    MEDIUM = 2500,
    HIGH = 10000
}
/**
 * The default factory tick spacings by fee amount.
 */
export declare const TICK_SPACINGS: {
    [amount in FeeAmount]: number;
};
export interface PoolState {
    feeAmount: FeeAmount;
    pick: number;
    state: 'no create' | 'create';
}
export interface TickData {
    tick: number;
    liquidityNet: string;
    liquidityGross: string;
}
export interface TickProcessed {
    tick: number;
    liquidityActive: bigint;
    liquidityNet: bigint;
    price0: string;
}
export declare class AddLiquidityV3Info {
    poolState: PoolState[];
    token0: Token;
    token1: Token;
    token0Balance: BalanceAndAllowance;
    token1Balance: BalanceAndAllowance;
    feeAmount: FeeAmount;
    token0Amount: string;
    token1Amount: string;
    first: boolean;
    firstPrice: string;
    minPrice: string;
    maxPrice: string;
    pool: Pool;
    rate: '10' | '20' | '50' | 'full';
    tickLower: number;
    tickUpper: number;
    tickData: {
        tickDatas: TickData[];
        ticksProcessed: TickProcessed[];
    };
    updateFeeAmount: (feeAmount: FeeAmount) => void;
    updateAllTickInfo: () => Promise<{
        tickDatas: TickData[];
        ticksProcessed: TickProcessed[];
    }>;
    updateToken0: (amount: string) => string;
    updateToken1: (amount: string) => string;
    checkFirstPrice: (inputFirstPrice: string) => (boolean);
    updateFirstPrice: (inputFirstPrice: string) => void;
    setPriceRange: (minPrice: string | boolean, maxPrice: string | boolean) => {
        minPrice: string;
        maxPrice: string;
    };
    setRate: (rate: '10' | '20' | '50' | 'full') => {
        minPrice: string;
        maxPrice: string;
    };
    addLiquidity: (connect: ConnectInfo, allowedSlippage: string, deadline: string | number) => Promise<TransactionEvent>;
}
export interface PositionContractDetails {
    nonce: string;
    tokenId: string;
    operator: string;
    token0: string;
    token1: string;
    fee: string;
    tickLower: string;
    tickUpper: string;
    liquidity: string;
    feeGrowthInside0LastX128: string;
    feeGrowthInside1LastX128: string;
    tokensOwed0: string;
    tokensOwed1: string;
}
export declare class LiquidityListData {
    tokenId: string;
    token0: Token;
    token1: Token;
    feeAmount: FeeAmount;
    minPrice: string;
    maxPrice: string;
    currentPrice: string;
    reverseCurrentPrice: string;
    reverseMinPrice: string;
    reverseMaxPrice: string;
    state: 'active' | 'close' | 'inactive';
    liquidity: string;
}
export declare class LiquidityInfo extends LiquidityListData {
    token0Balance: BalanceAndAllowance;
    token1Balance: BalanceAndAllowance;
    token0Price: TokenPrice;
    token1Price: TokenPrice;
    token0USD: string;
    token1USD: string;
    liquidityUSD: string;
    apr: string;
    collectToken0: string;
    collectToken1: string;
    collectToken0USD: string;
    collectToken1USD: string;
    collectUSD: string;
    token0Amount: string;
    token1Amount: string;
    histories: LiquidityHistory[];
    collectFee: (connect: ConnectInfo, involvesMNT: boolean) => Promise<TransactionEvent>;
    preRemoveLiquidity: (rate: string) => {
        amount0: string;
        amount1: string;
    };
    removeLiquidity: (connect: ConnectInfo, rate: string, involvesMNT: boolean, allowedSlippage: string, deadline: number | string) => Promise<TransactionEvent>;
    preAddLiquidity: (inputToken: Token, inputAmount: string) => {
        amount0: string;
        amount1: string;
    };
    addLiquidity: (connect: ConnectInfo, amount0: string, amount1: string, allowedSlippage: string, deadline: number | string) => Promise<TransactionEvent>;
}
export interface LiquidityHistory {
    time: number;
    txUrl: string;
    type: 'add' | 'remove' | 'collect_fee';
    token0Amount: string;
    token1Amount: string;
}
