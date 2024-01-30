import { SmartRouterTrade, TradeConfig } from './types';
import { Currency, CurrencyAmount, TradeType } from "../sdk";
export declare function getBestTrade(amount: CurrencyAmount<Currency>, currency: Currency, tradeType: TradeType, config: TradeConfig): Promise<SmartRouterTrade<TradeType> | null>;
