import type { SmartRouterTrade } from '../types';
import type { Percent } from '../../sdk';
import { CurrencyAmount, TradeType } from '../../sdk';
export declare function maximumAmountIn(trade: SmartRouterTrade<TradeType>, slippage: Percent, amountIn?: CurrencyAmount<import("../../sdk").Token>): CurrencyAmount<import("../../sdk").Token>;
export declare function minimumAmountOut(trade: SmartRouterTrade<TradeType>, slippage: Percent, amountOut?: CurrencyAmount<import("../../sdk").Token>): CurrencyAmount<import("../../sdk").Token>;
