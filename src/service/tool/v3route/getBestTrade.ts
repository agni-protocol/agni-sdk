import { computeAllRoutes, getBestRouteCombinationByQuotes } from './functions'
import { createGasModel } from './gasModel'
import { getRoutesWithValidQuote } from './getRoutesWithValidQuote'
import {BestRoutes, RouteConfig, RouteType, SmartRouterTrade, TradeConfig} from './types'
import {Currency, CurrencyAmount, TradeType, ZERO} from "../sdk";
import {Trace} from "../Tool";

export async function getBestTrade(
  amount: CurrencyAmount<Currency>,
  currency: Currency,
  tradeType: TradeType,
  config: TradeConfig,
): Promise<SmartRouterTrade<TradeType> | null> {
  const bestRoutes = await getBestRoutes(amount, currency, tradeType, config)
  if (!bestRoutes || bestRoutes.outputAmount.equalTo(ZERO)){
    throw new Error('Cannot find a valid swap route')
  }

  const { routes, gasEstimate, inputAmount, outputAmount } = bestRoutes
  // TODO restrict trade type to exact input if routes include one of the old
  // stable swap pools, which only allow to swap with exact input
  return {
    tradeType,
    routes,
    gasEstimate,
    inputAmount,
    outputAmount,
  }
}

// TODO distributionPercent 可以用来减少的路由的小额的多种情况,Pancake配置的5，但是因为RPC限流的问题，不得不减少RPC的请求，所以这里改成了25，配置必须是 5 的倍数，且能被100整除
async function getBestRoutes(
  amount: CurrencyAmount<Currency>,
  currency: Currency,
  tradeType: TradeType,
  routeConfig: RouteConfig,
): Promise<BestRoutes | null> {
  const {
    maxHops = 3,
    maxSplits = 4,
    distributionPercent = 50,
    poolProvider,
    quoteProvider,
    gasPriceWei,
    allowedPoolTypes,
  } = routeConfig
  const isExactIn = tradeType === TradeType.EXACT_INPUT
  const inputCurrency = isExactIn ? amount.currency : currency
  const outputCurrency = isExactIn ? currency : amount.currency

  const candidatePools = await poolProvider.getCandidatePools({
    currencyA: amount.currency,
    currencyB: currency,
    protocols: allowedPoolTypes,
  })

  let baseRoutes = computeAllRoutes(inputCurrency, outputCurrency, candidatePools, maxHops)
  // Do not support mix route on exact output
  if (tradeType === TradeType.EXACT_OUTPUT) {
    baseRoutes = baseRoutes.filter(({ type }) => type !== RouteType.MIXED)
  }

  const gasModel = await createGasModel({ gasPriceWei, quoteCurrency: currency })

  const routesWithValidQuote = await getRoutesWithValidQuote({
    amount,
    baseRoutes,
    distributionPercent,
    quoteProvider,
    tradeType,
    gasModel,
  })

  // TODO DEBUG ROUTE
  routesWithValidQuote.forEach(({ percent, path, amount: a, quote }) => {
    const pathStr = path.map(t => t.symbol).join('->')
    Trace.debug(
      `${percent}% Swap`,
      a.toExact(),
      a.currency.symbol,
      'through',
      pathStr,
      ':',
      quote.toExact(),
      quote.currency.symbol,
    )
  })
  return getBestRouteCombinationByQuotes(amount, currency, routesWithValidQuote, tradeType, { maxSplits })
}
