import sum from 'lodash/sum'
import BigNumber from 'bignumber.js'
import type { BigintIsh, Currency } from '../sdk'
import { CurrencyAmount, Price } from '../sdk'
import {Pool, PoolType} from '../../vo'
import { getCurrentAddressInfo } from '../../../Constant'
import type { GasCost, GasModel } from './types'
import {
  BASE_SWAP_COST_V2,
  BASE_SWAP_COST_V3, COST_PER_EXTRA_HOP_V2,
  COST_PER_HOP_V3,
  COST_PER_INIT_TICK,
  COST_PER_UNINIT_TICK
} from './constants'
import {isV2Pool, isV3Pool} from "./utils/pool";

interface GasModelConfig {
  gasPriceWei: BigintIsh
  quoteCurrency: Currency
}

export async function createGasModel({
  gasPriceWei,
  quoteCurrency,
}: GasModelConfig): Promise<GasModel> {
  const currentAddressInfo = getCurrentAddressInfo()
  const nativeWrappedToken = currentAddressInfo.getApi().tokenMangerApi().WNATIVE()
  const USDTToken = currentAddressInfo.getApi().tokenMangerApi().USDT()

  const { chainId } = quoteCurrency
  const gasPrice = BigInt(gasPriceWei)

  const tokenPrice = await currentAddressInfo.api.tokenMangerApi().tokenPrice(quoteCurrency, nativeWrappedToken)

  const estimateGasCost = (
    pools: Pool[],
    initializedTickCrossedList: number[],
  ): GasCost => {
    const totalInitializedTicksCrossed = BigInt(Math.max(1, sum(initializedTickCrossedList)))
    /**
     * Since we must make a separate call to multicall for each v3 and v2 section, we will have to
     * add the BASE_SWAP_COST to each section.
     */
    const poolTypeSet = new Set<PoolType>()
    let baseGasUse = 0n

    for (const pool of pools) {
      const { type } = pool
      if (isV2Pool(pool)) {
        if (!poolTypeSet.has(type)) {
          baseGasUse += BASE_SWAP_COST_V2
          poolTypeSet.add(type)
          continue
        }
        baseGasUse += COST_PER_EXTRA_HOP_V2
        continue
      }

      if (isV3Pool(pool)) {
        if (!poolTypeSet.has(type)) {
          baseGasUse += BASE_SWAP_COST_V3(chainId)
          poolTypeSet.add(type)
        }
        baseGasUse += COST_PER_HOP_V3(chainId)
        continue
      }
    }

    const tickGasUse = COST_PER_INIT_TICK(chainId) * totalInitializedTicksCrossed
    const uninitializedTickGasUse = COST_PER_UNINIT_TICK * 0n

    baseGasUse = baseGasUse + tickGasUse + uninitializedTickGasUse

    const baseGasCostWei = gasPrice * baseGasUse

    const totalGasCostNativeCurrency = CurrencyAmount.fromRawAmount(nativeWrappedToken, baseGasCostWei)

    const isQuoteNative = nativeWrappedToken.equals(quoteCurrency.wrapped)

    let gasCostInToken: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(quoteCurrency.wrapped, 0)
    let gasCostInUSD: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(USDTToken, 0)

    const quoteCurrencyPrice = tokenPrice[0]
    const nativeWrappedTokenPrice = tokenPrice[1]

    try {
      if (isQuoteNative)
        gasCostInToken = totalGasCostNativeCurrency

      if (!isQuoteNative) {
        const price = new Price(
          nativeWrappedToken,
          quoteCurrency,
          new BigNumber(1).multipliedBy(10 ** nativeWrappedToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
          new BigNumber(quoteCurrencyPrice.priceMNT).multipliedBy(10 ** quoteCurrency.decimals).toFixed(0, BigNumber.ROUND_DOWN),
        )
        gasCostInToken = price.quote(totalGasCostNativeCurrency)
      }

      if (nativeWrappedTokenPrice) {
        const nativeTokenUsdPrice = new Price(
          nativeWrappedToken,
          USDTToken,
          new BigNumber(1).multipliedBy(10 ** nativeWrappedToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
          new BigNumber(quoteCurrencyPrice.priceUSD).multipliedBy(10 ** USDTToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
        )
        gasCostInUSD = nativeTokenUsdPrice.quote(totalGasCostNativeCurrency)
      }
    }
    catch (e) {
      // console.warn('Cannot estimate gas cost', e)
    }
    return {
      gasEstimate: baseGasUse,
      gasCostInToken,
      gasCostInUSD,
    }
  }

  return {
    estimateGasCost,
  }
}
