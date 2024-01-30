import type { PoolSelectorConfig } from '../types'
import type { Currency, Token } from '../../sdk'
import type {V2PoolWithTvl, V3PoolWithTvl, WithTvl} from '../../../vo'
import { getCurrentAddressInfo } from '../../../../Constant'

export const DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfig = {
  topN: 2,
  topNDirectSwaps: 2,
  topNTokenInOut: 2,
  topNSecondHop: 1,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 3,
}

export const V2_DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfig = {
  topN: 3,
  topNDirectSwaps: 2,
  topNTokenInOut: 2,
  topNSecondHop: 1,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 3,
}

const sortByTvl = (a: WithTvl, b: WithTvl) => (a.tvlUSD >= b.tvlUSD ? -1 : 1)

interface FactoryParams<P extends WithTvl> {
  getPoolSelectorConfig: (currencyA?: Currency, currencyB?: Currency) => PoolSelectorConfig
  getPoolAddress: (pool: P) => string
  getToken0: (pool: P) => Currency
  getToken1: (pool: P) => Currency
}

function poolSelectorFactory<P extends WithTvl>({
                                                  getPoolSelectorConfig,
                                                  getToken0,
                                                  getToken1,
                                                  getPoolAddress,
                                                }: FactoryParams<P>) {
  return function tvlSelector(
    currencyA: Currency | undefined,
    currencyB: Currency | undefined,
    unorderedPoolsWithTvl: P[],
  ) {
    const POOL_SELECTION_CONFIG = getPoolSelectorConfig(currencyA, currencyB)
    if (!currencyA || !currencyB || !unorderedPoolsWithTvl.length) {
      return []
    }
    const poolsFromSubgraph = unorderedPoolsWithTvl.sort(sortByTvl)
    const { chainId } = getToken0(poolsFromSubgraph[0])
    const baseTokens: Token[] = getCurrentAddressInfo().getApi().tokenMangerApi().tradeTokens()

    const poolSet = new Set<string>()
    const addToPoolSet = (pools: P[]) => {
      for (const pool of pools) {
        poolSet.add(getPoolAddress(pool))
      }
    }

    const topByBaseWithTokenIn = baseTokens
      .map((token) => {
        return poolsFromSubgraph
          .filter((subgraphPool) => {
            return (
              (getToken0(subgraphPool).wrapped.equals(token) &&
                getToken1(subgraphPool).wrapped.equals(currencyA.wrapped)) ||
              (getToken1(subgraphPool).wrapped.equals(token) &&
                getToken0(subgraphPool).wrapped.equals(currencyA.wrapped))
            )
          })
          .sort(sortByTvl)
          .slice(0, POOL_SELECTION_CONFIG.topNWithEachBaseToken)
      })
      .reduce<P[]>((acc, cur) => [...acc, ...cur], [])
      .sort(sortByTvl)
      .slice(0, POOL_SELECTION_CONFIG.topNWithBaseToken)

    addToPoolSet(topByBaseWithTokenIn)

    const topByBaseWithTokenOut = baseTokens
      .map((token) => {
        return poolsFromSubgraph
          .filter((subgraphPool) => {
            if (poolSet.has(getPoolAddress(subgraphPool))) {
              return false
            }
            return (
              (getToken0(subgraphPool).wrapped.equals(token) &&
                getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
              (getToken1(subgraphPool).wrapped.equals(token) &&
                getToken0(subgraphPool).wrapped.equals(currencyB.wrapped))
            )
          })
          .sort(sortByTvl)
          .slice(0, POOL_SELECTION_CONFIG.topNWithEachBaseToken)
      })
      .reduce<P[]>((acc, cur) => [...acc, ...cur], [])
      .sort(sortByTvl)
      .slice(0, POOL_SELECTION_CONFIG.topNWithBaseToken)

    addToPoolSet(topByBaseWithTokenOut)

    const top2DirectPools = poolsFromSubgraph
      .filter((subgraphPool) => {
        if (poolSet.has(getPoolAddress(subgraphPool))) {
          return false
        }
        return (
          (getToken0(subgraphPool).wrapped.equals(currencyA.wrapped) &&
            getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
          (getToken1(subgraphPool).wrapped.equals(currencyA.wrapped) &&
            getToken0(subgraphPool).wrapped.equals(currencyB.wrapped))
        )
      })
      .slice(0, POOL_SELECTION_CONFIG.topNDirectSwaps)

    addToPoolSet(top2DirectPools)

    const nativeToken = getCurrentAddressInfo().getApi().tokenMangerApi().WNATIVE()
    const top2EthBaseTokenPool = nativeToken
      ? poolsFromSubgraph
        .filter((subgraphPool) => {
          if (poolSet.has(getPoolAddress(subgraphPool))) {
            return false
          }
          return (
            (getToken0(subgraphPool).wrapped.equals(nativeToken) &&
              getToken1(subgraphPool).wrapped.equals(currencyA.wrapped)) ||
            (getToken1(subgraphPool).wrapped.equals(nativeToken) &&
              getToken0(subgraphPool).wrapped.equals(currencyA.wrapped))
          )
        })
        .slice(0, 1)
      : []
    addToPoolSet(top2EthBaseTokenPool)

    const top2EthQuoteTokenPool = nativeToken
      ? poolsFromSubgraph
        .filter((subgraphPool) => {
          if (poolSet.has(getPoolAddress(subgraphPool))) {
            return false
          }
          return (
            (getToken0(subgraphPool).wrapped.equals(nativeToken) &&
              getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
            (getToken1(subgraphPool).wrapped.equals(nativeToken) &&
              getToken0(subgraphPool).wrapped.equals(currencyB.wrapped))
          )
        })
        .slice(0, 1)
      : []
    addToPoolSet(top2EthQuoteTokenPool)

    const topByTVL = poolsFromSubgraph
      .slice(0, POOL_SELECTION_CONFIG.topN)
      .filter((pool) => !poolSet.has(getPoolAddress(pool)))
    addToPoolSet(topByTVL)

    const topByTVLUsingTokenBase = poolsFromSubgraph
      .filter((subgraphPool) => {
        if (poolSet.has(getPoolAddress(subgraphPool))) {
          return false
        }
        return (
          getToken0(subgraphPool).wrapped.equals(currencyA.wrapped) ||
          getToken1(subgraphPool).wrapped.equals(currencyA.wrapped)
        )
      })
      .slice(0, POOL_SELECTION_CONFIG.topNTokenInOut)
    addToPoolSet(topByTVLUsingTokenBase)

    const topByTVLUsingTokenQuote = poolsFromSubgraph
      .filter((subgraphPool) => {
        if (poolSet.has(getPoolAddress(subgraphPool))) {
          return false
        }
        return (
          getToken0(subgraphPool).wrapped.equals(currencyB.wrapped) ||
          getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)
        )
      })
      .slice(0, POOL_SELECTION_CONFIG.topNTokenInOut)
    addToPoolSet(topByTVLUsingTokenQuote)

    const getTopByTVLUsingTokenSecondHops = (base: P[], tokenToCompare: Currency) =>
      base
        .map((subgraphPool) => {
          return getToken0(subgraphPool).wrapped.equals(tokenToCompare.wrapped)
            ? getToken1(subgraphPool)
            : getToken0(subgraphPool)
        })
        .map((secondHopToken: Currency) => {
          return poolsFromSubgraph.filter((subgraphPool) => {
            if (poolSet.has(getPoolAddress(subgraphPool))) {
              return false
            }
            return (
              getToken0(subgraphPool).wrapped.equals(secondHopToken.wrapped) ||
              getToken1(subgraphPool).wrapped.equals(secondHopToken.wrapped)
            )
          })
        })
        .reduce<P[]>((acc, cur) => [...acc, ...cur], [])
        // Uniq
        .reduce<P[]>((acc, cur) => (acc.some((p) => p === cur) ? acc : [...acc, cur]), [])
        .sort(sortByTvl)
        .slice(0, POOL_SELECTION_CONFIG.topNSecondHop)

    const topByTVLUsingTokenInSecondHops = getTopByTVLUsingTokenSecondHops(
      [...topByTVLUsingTokenBase, ...topByBaseWithTokenIn],
      currencyA,
    )
    addToPoolSet(topByTVLUsingTokenInSecondHops)

    const topByTVLUsingTokenOutSecondHops = getTopByTVLUsingTokenSecondHops(
      [...topByTVLUsingTokenQuote, ...topByBaseWithTokenOut],
      currencyB,
    )
    addToPoolSet(topByTVLUsingTokenOutSecondHops)

    const pools = [
      ...topByBaseWithTokenIn,
      ...topByBaseWithTokenOut,
      ...top2DirectPools,
      ...top2EthBaseTokenPool,
      ...top2EthQuoteTokenPool,
      ...topByTVL,
      ...topByTVLUsingTokenBase,
      ...topByTVLUsingTokenQuote,
      ...topByTVLUsingTokenInSecondHops,
      ...topByTVLUsingTokenOutSecondHops,
    ]
    // eslint-disable-next-line
    return pools.map(({ tvlUSD, ...rest }) => rest)
  }
}

export const v3PoolTvlSelector = poolSelectorFactory<V3PoolWithTvl>({
  getPoolSelectorConfig: (currencyA?: Currency, currencyB?: Currency) => DEFAULT_POOL_SELECTOR_CONFIG,
  getToken0: (p) => p.token0,
  getToken1: (p) => p.token1,
  getPoolAddress: (p) => p.address,
})

export const v2PoolTvlSelector = poolSelectorFactory<V2PoolWithTvl>({
  getPoolSelectorConfig: (currencyA?: Currency, currencyB?: Currency) => V2_DEFAULT_POOL_SELECTOR_CONFIG,
  getToken0: (p) => p.reserve0.currency,
  getToken1: (p) => p.reserve1.currency,
  getPoolAddress: (p) => p.address,
})
