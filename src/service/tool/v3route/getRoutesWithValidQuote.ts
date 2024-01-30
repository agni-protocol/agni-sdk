import type {Currency, CurrencyAmount} from '../sdk'
import {TradeType} from '../sdk'
import type {BaseRoute, GasModel, QuoteProvider, RouteWithoutQuote, RouteWithQuote} from './types'
import {getAmountDistribution} from './functions'

interface Params {
  amount: CurrencyAmount<Currency>
  baseRoutes: BaseRoute[]
  distributionPercent: number
  quoteProvider: QuoteProvider
  tradeType: TradeType
  gasModel: GasModel
}

export async function getRoutesWithValidQuote({
                                                amount,
                                                baseRoutes,
                                                distributionPercent,
                                                quoteProvider,
                                                tradeType,
                                                gasModel,
                                              }: Params): Promise<RouteWithQuote[]> {
  const [percents, amounts] = getAmountDistribution(amount, distributionPercent)

  // 拼route
  const routesWithoutQuote = amounts.reduce<RouteWithoutQuote[]>(
    (acc, curAmount, i) => [
      ...acc,
      ...baseRoutes.map(r => ({
        ...r,
        amount: curAmount,
        percent: percents[i],
      })),
    ],
    [],
  )

  if (tradeType === TradeType.EXACT_INPUT) {
    return quoteProvider.getRouteWithQuotesExactIn(routesWithoutQuote, {gasModel})
  } else {
    return quoteProvider.getRouteWithQuotesExactOut(routesWithoutQuote, {gasModel})
  }

}
