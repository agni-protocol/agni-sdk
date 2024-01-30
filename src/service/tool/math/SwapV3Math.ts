import flatMap from 'lodash/flatMap'
import { ethers } from 'ethers'
import type { Currency, Token, TradeType } from '../sdk'
import { getCurrentAddressInfo } from '../../../Constant'
import { eqAddress } from '../Tool'
import type { BaseRoute, SmartRouterTrade } from '../v3route/types'
import type {FeeAmount, Pool} from '../../vo'
import { CurrencyAmount, Percent, ZERO } from '../sdk'
import { ONE_HUNDRED_PERCENT } from '../sdk/v3/internalConstants'
import {getOutputCurrency, isV2Pool, isV3Pool} from "../v3route/utils/pool";
import {getMidPrice} from "../v3route/utils/route";

export const V2_FEE_PATH_PLACEHOLDER = 8388608
export const BIPS_BASE = 10000n
export const BASE_FEE = new Percent(25n, BIPS_BASE)
export const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE)

export function getPairCombinations(currencyA: Token, currencyB: Token): [Token, Token][] {
  const currentAddressInfo = getCurrentAddressInfo()
  const [tokenA, tokenB] = [currencyA, currencyB].sort((a, b) => a.sortsBefore(b) ? -1 : 1)
  const bases = currentAddressInfo.getApi().tokenMangerApi().tradeTokens()
  const basePairs: [Token, Token][] = flatMap(bases, (base): [Token, Token][] =>
    bases.map(otherBase => [base, otherBase]))
  const keySet = new Set<string>()
  const result: [Token, Token][] = [];
  [
    // the direct pair
    [tokenA, tokenB],
    // token A against all bases
    ...bases.map((base): [Token, Token] => [tokenA, base]),
    // token B against all bases
    ...bases.map((base): [Token, Token] => [tokenB, base]),
    // each base against all bases
    ...basePairs,
  ]
    .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
    .filter(([t0, t1]) => !eqAddress(t0.erc20Address(), t1.erc20Address()))
    .forEach((it) => {
      const [t0, t1] = it.sort((a, b) => a.sortsBefore(b) ? -1 : 1)
      const key = `${t0.erc20Address()}-${t1.erc20Address()}`
      if (!keySet.has(key)) {
        keySet.add(key)
        result.push(it)
      }
    })
  return result
}

/**
 * Converts a route to a hex encoded path
 * @param route the mixed path to convert to an encoded path
 * @returns the encoded path
 */
export function encodeMixedRouteToPath(route: BaseRoute, exactOutput: boolean): string {
  const firstInputToken: Token = route.input.wrapped
  const { path, types } = route.pools.reduce(
    (
      // eslint-disable-next-line @typescript-eslint/no-shadow
      { inputToken, path, types }: { inputToken: Token; path: (string | number)[]; types: string[] },
      pool: Pool,
      index,
    ): { inputToken: Token; path: (string | number)[]; types: string[] } => {
      const outputToken = getOutputCurrency(pool, inputToken).wrapped
      const fee = isV3Pool(pool) ? pool.fee : V2_FEE_PATH_PLACEHOLDER
      if (index === 0) {
        return {
          inputToken: outputToken,
          types: ['address', 'uint24', 'address'],
          path: [inputToken.address, fee, outputToken.address],
        }
      }
      return {
        inputToken: outputToken,
        types: [...types, 'uint24', 'address'],
        path: [...path, fee, outputToken.address],
      }
    },
    { inputToken: firstInputToken, path: [], types: [] },
  )
  return exactOutput ? ethers.solidityPacked(types.reverse(), path.reverse()) : ethers.solidityPacked(types, path)
}

export function computeTradePriceBreakdown(trade?: SmartRouterTrade<TradeType> | null): {
  priceImpactWithoutFee?: Percent | null
  lpFeeAmount?: CurrencyAmount<Currency> | null
} {
  if (!trade) {
    return {
      priceImpactWithoutFee: undefined,
      lpFeeAmount: null,
    }
  }

  const { routes, outputAmount, inputAmount } = trade
  let feePercent = new Percent(0)
  let outputAmountWithoutPriceImpact = CurrencyAmount.fromRawAmount(trade.outputAmount.wrapped.currency, 0)
  for (const route of routes) {
    const { inputAmount: routeInputAmount, pools, percent } = route
    const routeFeePercent = ONE_HUNDRED_PERCENT.subtract(
      pools.reduce<Percent>((currentFee, pool) => {
        if (isV2Pool(pool)) {
          return currentFee.multiply(INPUT_FRACTION_AFTER_FEE)
        }
        if (isV3Pool(pool)) {
          return currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(v3FeeToPercent(pool.fee)))
        }
        return currentFee
      }, ONE_HUNDRED_PERCENT),
    )
    // Not accurate since for stable swap, the lp fee is deducted on the output side
    feePercent = feePercent.add(routeFeePercent.multiply(new Percent(percent, 100)))

    const midPrice = getMidPrice(route)
    outputAmountWithoutPriceImpact = outputAmountWithoutPriceImpact.add(
      midPrice.quote(routeInputAmount.wrapped) as CurrencyAmount<Token>,
    )
  }

  if (outputAmountWithoutPriceImpact.quotient === ZERO) {
    return {
      priceImpactWithoutFee: undefined,
      lpFeeAmount: null,
    }
  }

  const priceImpactRaw = outputAmountWithoutPriceImpact
    .subtract(outputAmount.wrapped)
    .divide(outputAmountWithoutPriceImpact)
  const priceImpactPercent = new Percent(priceImpactRaw.numerator, priceImpactRaw.denominator)
  const priceImpactWithoutFee = priceImpactPercent.subtract(feePercent)
  const lpFeeAmount = inputAmount.multiply(feePercent)

  return {
    priceImpactWithoutFee,
    lpFeeAmount,
  }
}

function v3FeeToPercent(fee: FeeAmount): Percent {
  return new Percent(fee, 10000n * 100n)
}
