import memoize from 'lodash/memoize.js'
import {Pool, PoolType, V2Pool, V3Pool} from "../../../vo";
import {Currency, Price} from "../../sdk";
import {Pair} from "../../sdk/v2";
import {Pool as SDKV3Pool} from '../../sdk/v3'
import {PoolV3Api} from "../../../api";

export function isV2Pool(pool: Pool): pool is V2Pool {
  return pool.type === PoolType.V2
}

export function isV3Pool(pool: Pool): pool is V3Pool {
  return pool.type === PoolType.V3
}

export function involvesCurrency(pool: Pool, currency: Currency) {
  const token = currency.wrapped
  if (isV2Pool(pool)) {
    const {reserve0, reserve1} = pool
    return reserve0.currency.equals(token) || reserve1.currency.equals(token)
  }
  if (isV3Pool(pool)) {
    const {token0, token1} = pool
    return token0.equals(token) || token1.equals(token)
  }
  return false
}


// FIXME current verison is not working with stable pools that have more than 2 tokens
export function getOutputCurrency(pool: Pool, currencyIn: Currency): Currency {
  const tokenIn = currencyIn.wrapped
  if (isV2Pool(pool)) {
    const {reserve0, reserve1} = pool
    return reserve0.currency.equals(tokenIn) ? reserve1.currency : reserve0.currency
  }
  if (isV3Pool(pool)) {
    const {token0, token1} = pool
    return token0.equals(tokenIn) ? token1 : token0
  }
  throw new Error('Cannot get output currency by invalid pool')
}

export const computeV3PoolAddress = memoize(
  (tokenA, tokenB, fee) => {
    return PoolV3Api.computePoolAddress(tokenA, tokenB, fee)
  },
  (tokenA, tokenB, fee) =>
    `${tokenA.chainId}_${tokenA.address}_${tokenB.address}_${fee}`,
)

export const computeV2PoolAddress = memoize(
  Pair.getAddress,
  (tokenA, tokenB) => `${tokenA.chainId}_${tokenA.address}_${tokenB.address}`,
)

export const getPoolAddress = memoize(
  function getAddress(pool: Pool): string | '' {
    if (isV3Pool(pool)) {
      return pool.address
    }
    if (isV2Pool(pool)) {
      const {reserve0, reserve1} = pool
      return computeV2PoolAddress(reserve0.currency.wrapped, reserve1.currency.wrapped)
    }
    return ''
  },
  (pool) => {
    const [token0, token1] = isV2Pool(pool)
      ? [pool.reserve0.currency.wrapped, pool.reserve1.currency.wrapped]
      : [pool.token0.wrapped, pool.token1.wrapped]
    return `${pool.type}_${token0.chainId}_${token0.address}_${token1.address}`
  },
)

export function getTokenPrice(pool: Pool, base: Currency, quote: Currency): Price<Currency, Currency> {
  if (isV3Pool(pool)) {
    const {token0, token1, fee, liquidity, sqrtRatioX96, tick} = pool
    const v3Pool = new SDKV3Pool(token0.wrapped, token1.wrapped, fee, sqrtRatioX96, liquidity, tick)
    return v3Pool.priceOf(base.wrapped)
  }

  if (isV2Pool(pool)) {
    const pair = new Pair(pool.reserve0.wrapped, pool.reserve1.wrapped)
    return pair.priceOf(base.wrapped)
  }

  return new Price(base, quote, 1n, 0n)
}
