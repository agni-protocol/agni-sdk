import { GasCost } from './gasCost';
import { Currency, CurrencyAmount } from "../../sdk";
import { Pool } from "../../../vo";
export declare enum RouteType {
    V2 = 0,
    V3 = 1,
    MIXED = 2
}
export interface BaseRoute {
    type: RouteType;
    pools: Pool[];
    path: Currency[];
    input: Currency;
    output: Currency;
}
export interface RouteWithoutQuote extends BaseRoute {
    percent: number;
    amount: CurrencyAmount<Currency>;
}
export type RouteEssentials = Omit<RouteWithoutQuote, 'input' | 'output' | 'amount'>;
export interface Route extends RouteEssentials {
    inputAmount: CurrencyAmount<Currency>;
    outputAmount: CurrencyAmount<Currency>;
}
export interface RouteQuote extends GasCost {
    quoteAdjustedForGas: CurrencyAmount<Currency>;
    quote: CurrencyAmount<Currency>;
}
export type RouteWithQuote = RouteWithoutQuote & RouteQuote;
export type RouteWithoutGasEstimate = Omit<RouteWithQuote, 'quoteAdjustedForGas' | 'gasEstimate' | 'gasCostInToken' | 'gasCostInUSD'>;
export interface BestRoutes {
    gasEstimate: bigint;
    routes: Route[];
    inputAmount: CurrencyAmount<Currency>;
    outputAmount: CurrencyAmount<Currency>;
}
