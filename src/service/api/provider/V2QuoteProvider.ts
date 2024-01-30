import {BASE_API, BaseApi} from "../BaseApi";
import {CacheKey, Currency, CurrencyAmount} from "../../tool";
import {Pool, V2Pool} from "../../vo";
import {QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote} from "../../tool/v3route/types";
import {isV2Pool, isV3Pool} from "../../tool/v3route/utils/pool";
import {Pair} from "../../tool/sdk/v2";

@CacheKey('V2QuoteProvider')
export class V2QuoteProvider implements QuoteProvider {
  public baseApi: BaseApi = BASE_API

  createGetV2Quote(isExactIn = true) {
    return function getV2Quote(
      {reserve0, reserve1}: V2Pool,
      amount: CurrencyAmount<Currency>,
    ): CurrencyAmount<Currency> {
      const pair = new Pair(reserve0.wrapped, reserve1.wrapped)
      const [quote] = isExactIn ? pair.getOutputAmount(amount.wrapped) : pair.getInputAmount(amount.wrapped)
      return quote
    }
  }

  getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    const getRoutesWithQuotes = this.createGetRoutesWithQuotes(true);
    return getRoutesWithQuotes(routes, options)
  }

  getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    const getRoutesWithQuotes = this.createGetRoutesWithQuotes(false);
    return getRoutesWithQuotes(routes, options)
  }

  createGetRoutesWithQuotes(isExactIn = true) {
    const getV2Quote = this.createGetV2Quote(isExactIn)

    function* each(pools: Pool[]) {
      let i = isExactIn ? 0 : pools.length - 1
      const hasNext = () => (isExactIn ? i < pools.length : i >= 0)
      while (hasNext()) {
        yield [pools[i], i] as [Pool, number]
        if (isExactIn) {
          i += 1
        } else {
          i -= 1
        }
      }
    }

    const adjustQuoteForGas = (quote: CurrencyAmount<Currency>, gasCostInToken: CurrencyAmount<Currency>) => {
      if (isExactIn) {
        return quote.subtract(gasCostInToken)
      }
      return quote.add(gasCostInToken)
    }

    return async function getRoutesWithQuotes(
      routes: RouteWithoutQuote[],
      {gasModel}: QuoterOptions,
    ): Promise<RouteWithQuote[]> {
      const routesWithQuote: RouteWithQuote[] = []
      for (const route of routes) {
        try {
          const {pools, amount} = route
          let quote = amount
          const initializedTickCrossedList = Array(pools.length).fill(0)
          const quoteSuccess = true
          for (const [pool,] of each(pools)) {
            if (isV2Pool(pool)) {
              quote = getV2Quote(pool, quote)
              continue
            }
            if (isV3Pool(pool)) {
              throw new Error('V3 pool is not supported')
            }
          }
          if (!quoteSuccess) {
            continue
          }

          const {gasEstimate, gasCostInUSD, gasCostInToken} = gasModel.estimateGasCost(
            pools,
            initializedTickCrossedList,
          )
          routesWithQuote.push({
            ...route,
            quote,
            quoteAdjustedForGas: adjustQuoteForGas(quote, gasCostInToken),
            gasEstimate,
            gasCostInUSD,
            gasCostInToken,
          })
        } catch (e) {
          // console.warn('Failed to get quote from route', route, e)
        }
      }
      return routesWithQuote
    }
  }
}
