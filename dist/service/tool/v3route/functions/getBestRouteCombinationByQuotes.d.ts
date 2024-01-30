import type { BestRoutes, RouteWithQuote } from '../types';
import type { ChainId, Currency } from '../../sdk';
import { CurrencyAmount, TradeType } from '../../sdk';
interface Config {
    minSplits?: number;
    maxSplits?: number;
}
export declare function getBestRouteCombinationByQuotes(amount: CurrencyAmount<Currency>, quoteCurrency: Currency, routesWithQuote: RouteWithQuote[], tradeType: TradeType, config: Config): BestRoutes | null;
export declare function getBestSwapRouteBy(tradeType: TradeType, percentToQuotes: {
    [percent: number]: RouteWithQuote[];
}, percents: number[], chainId: ChainId, by: (routeQuote: RouteWithQuote) => CurrencyAmount<Currency>, { maxSplits, minSplits }: Config): {
    quote: CurrencyAmount<Currency>;
    quoteGasAdjusted: CurrencyAmount<Currency>;
    estimatedGasUsed: bigint;
    routes: RouteWithQuote[];
} | null;
export {};
