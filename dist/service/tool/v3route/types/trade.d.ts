import { Route } from './route';
import { PoolProvider, QuoteProvider } from './providers';
import { BigintIsh, Currency, CurrencyAmount, TradeType } from "../../sdk";
import { PoolType } from "../../../vo";
export interface SmartRouterTrade<TTradeType extends TradeType> {
    tradeType: TTradeType;
    inputAmount: CurrencyAmount<Currency>;
    outputAmount: CurrencyAmount<Currency>;
    routes: Route[];
    gasEstimate: bigint;
}
export interface TradeConfig {
    gasPriceWei: BigintIsh;
    poolProvider: PoolProvider;
    quoteProvider: QuoteProvider;
    maxHops?: number;
    maxSplits?: number;
    distributionPercent?: number;
    allowedPoolTypes?: PoolType[];
}
export interface RouteConfig extends TradeConfig {
}
