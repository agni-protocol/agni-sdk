import type { Currency, CurrencyAmount } from '../sdk';
import { TradeType } from '../sdk';
import type { BaseRoute, GasModel, QuoteProvider, RouteWithQuote } from './types';
interface Params {
    amount: CurrencyAmount<Currency>;
    baseRoutes: BaseRoute[];
    distributionPercent: number;
    quoteProvider: QuoteProvider;
    tradeType: TradeType;
    gasModel: GasModel;
}
export declare function getRoutesWithValidQuote({ amount, baseRoutes, distributionPercent, quoteProvider, tradeType, gasModel, }: Params): Promise<RouteWithQuote[]>;
export {};
