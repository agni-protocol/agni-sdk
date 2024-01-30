import { BaseApi } from "../BaseApi";
import { type GasModel, QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote } from "../../tool/v3route/types";
export declare class MixedQuoteProvider implements QuoteProvider {
    baseApi: BaseApi;
    getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotes(routes: RouteWithoutQuote[], gasModel: GasModel, isExactIn: boolean): Promise<RouteWithQuote[]>;
}
