import { QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote } from "../../tool/v3route/types";
import { BaseApi } from "../BaseApi";
export declare class QuoteProviderFactory implements QuoteProvider {
    baseApi: BaseApi;
    getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]>;
    createGetRouteWithQuotes(isExactIn?: boolean): (routes: RouteWithoutQuote[], { gasModel }: QuoterOptions) => Promise<RouteWithQuote[]>;
}
