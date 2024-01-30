import { BaseApi } from "../BaseApi";
import { Currency, CurrencyAmount } from "../../tool";
import { V2Pool } from "../../vo";
import { QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote } from "../../tool/v3route/types";
export declare class V2QuoteProvider implements QuoteProvider {
    baseApi: BaseApi;
    createGetV2Quote(isExactIn?: boolean): ({ reserve0, reserve1 }: V2Pool, amount: CurrencyAmount<Currency>) => CurrencyAmount<Currency>;
    getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    createGetRoutesWithQuotes(isExactIn?: boolean): (routes: RouteWithoutQuote[], { gasModel }: QuoterOptions) => Promise<RouteWithQuote[]>;
}
