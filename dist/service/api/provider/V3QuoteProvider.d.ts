import { type GasModel, QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote } from "../../tool/v3route/types";
import { BaseApi } from "../BaseApi";
export declare class V3QuoteProvider implements QuoteProvider {
    baseApi: BaseApi;
    getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotes(routes: RouteWithoutQuote[], gasModel: GasModel, isExactIn: boolean): Promise<RouteWithQuote[]>;
}
