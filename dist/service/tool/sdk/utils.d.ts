import type { VMType } from './constants';
import type { Currency } from './currency';
import type { CurrencyAmount, Price } from './fractions';
import { Percent } from './fractions';
import type { Token } from './token';
export declare function validateVMTypeInstance(value: bigint, vmType: VMType): void;
export declare function sqrt(y: bigint): bigint;
export declare function sortedInsert<T>(items: T[], add: T, maxSize: number, comparator: (a: T, b: T) => number): T | null;
/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
export declare function computePriceImpact<TBase extends Currency, TQuote extends Currency>(midPrice: Price<TBase, TQuote>, inputAmount: CurrencyAmount<TBase>, outputAmount: CurrencyAmount<TQuote>): Percent;
export declare function getTokenComparator(balances: {
    [tokenAddress: string]: CurrencyAmount<Token> | undefined;
}): (tokenA: Token, tokenB: Token) => number;
