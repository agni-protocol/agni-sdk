import type { Currency, Token, TradeType } from '../sdk';
import type { BaseRoute, SmartRouterTrade } from '../v3route/types';
import { CurrencyAmount, Percent } from '../sdk';
export declare const V2_FEE_PATH_PLACEHOLDER = 8388608;
export declare const BIPS_BASE = 10000n;
export declare const BASE_FEE: Percent;
export declare const INPUT_FRACTION_AFTER_FEE: Percent;
export declare function getPairCombinations(currencyA: Token, currencyB: Token): [Token, Token][];
/**
 * Converts a route to a hex encoded path
 * @param route the mixed path to convert to an encoded path
 * @returns the encoded path
 */
export declare function encodeMixedRouteToPath(route: BaseRoute, exactOutput: boolean): string;
export declare function computeTradePriceBreakdown(trade?: SmartRouterTrade<TradeType> | null): {
    priceImpactWithoutFee?: Percent | null;
    lpFeeAmount?: CurrencyAmount<Currency> | null;
};
