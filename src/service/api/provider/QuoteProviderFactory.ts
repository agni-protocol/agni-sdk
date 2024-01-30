import {QuoteProvider, QuoterOptions, RouteType, RouteWithoutQuote, RouteWithQuote} from "../../tool/v3route/types";
import {CacheKey, mixProxy} from "../../tool";
import {isV3Pool} from "../../tool/v3route/utils/pool";
import {V3QuoteProvider} from "./V3QuoteProvider";
import {V2QuoteProvider} from "./V2QuoteProvider";
import {MixedQuoteProvider} from "./MixedQuoteProvider";
import {BASE_API, BaseApi} from "../BaseApi";


@CacheKey('QuoteProviderFactory')
export class QuoteProviderFactory implements QuoteProvider {

  public baseApi: BaseApi = BASE_API

  getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    const getRouteWithQuotes = this.createGetRouteWithQuotes(true);
    return getRouteWithQuotes(routes, options)
  }

  getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    const getRouteWithQuotes = this.createGetRouteWithQuotes(false);
    return getRouteWithQuotes(routes, options)
  }

  createGetRouteWithQuotes(isExactIn = true) {

    const v3QuoteProvider = mixProxy(V3QuoteProvider);
    const v2QuoteProvider = mixProxy(V2QuoteProvider);
    const mixedQuoteProvider = mixProxy(MixedQuoteProvider);

    const getOffChainQuotes = isExactIn
      ? (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => v2QuoteProvider.getRouteWithQuotesExactIn(routes, options)
      : (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => v2QuoteProvider.getRouteWithQuotesExactOut(routes, options)
    const getMixedRouteQuotes = isExactIn
      ? (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => mixedQuoteProvider.getRouteWithQuotesExactIn(routes, options)
      : (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => mixedQuoteProvider.getRouteWithQuotesExactOut(routes, options)
    const getV3Quotes = isExactIn
      ? (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => v3QuoteProvider.getRouteWithQuotesExactIn(routes, options)
      : (routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> => v3QuoteProvider.getRouteWithQuotesExactOut(routes, options)

    return async function getRoutesWithQuotes(
      routes: RouteWithoutQuote[],
      {gasModel}: QuoterOptions,
    ): Promise<RouteWithQuote[]> {

      if (routes.length === 0) {
        return []
      }

      const v3SingleHopRoutes: RouteWithoutQuote[] = []
      const v3MultihopRoutes: RouteWithoutQuote[] = []
      const mixedRoutesHaveV3Pool: RouteWithoutQuote[] = []
      const routesCanQuoteOffChain: RouteWithoutQuote[] = []
      for (const route of routes) {
        if (route.type === RouteType.V2) {
          routesCanQuoteOffChain.push(route)
          continue
        }
        if (route.type === RouteType.V3) {
          if (route.pools.length === 1) {
            v3SingleHopRoutes.push(route)
            continue
          }
          v3MultihopRoutes.push(route)
          continue
        }
        const {pools} = route
        if (pools.some((pool) => isV3Pool(pool))) {
          mixedRoutesHaveV3Pool.push(route)
          continue
        }
        routesCanQuoteOffChain.push(route)
      }

      const results = await Promise.allSettled([
        getOffChainQuotes(routesCanQuoteOffChain, {gasModel}),
        getMixedRouteQuotes(mixedRoutesHaveV3Pool, {gasModel}),
        getV3Quotes(v3SingleHopRoutes, {gasModel}),
        getV3Quotes(v3MultihopRoutes, {gasModel}),
      ])
      if (results.every((result) => result.status === 'rejected')) {
        throw new Error(results.map((result) => (result as PromiseRejectedResult).reason).join(','))
      }
      return results
        .filter((result): result is PromiseFulfilledResult<RouteWithQuote[]> => result.status === 'fulfilled')
        .reduce<RouteWithQuote[]>((acc, cur) => [...acc, ...cur.value], [])
    }
  }


}
