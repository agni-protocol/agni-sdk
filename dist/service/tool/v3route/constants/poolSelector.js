"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v2PoolTvlSelector = exports.v3PoolTvlSelector = exports.V2_DEFAULT_POOL_SELECTOR_CONFIG = exports.DEFAULT_POOL_SELECTOR_CONFIG = void 0;
const Constant_1 = require("../../../../Constant");
exports.DEFAULT_POOL_SELECTOR_CONFIG = {
    topN: 2,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 3,
};
exports.V2_DEFAULT_POOL_SELECTOR_CONFIG = {
    topN: 3,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 3,
};
const sortByTvl = (a, b) => (a.tvlUSD >= b.tvlUSD ? -1 : 1);
function poolSelectorFactory({ getPoolSelectorConfig, getToken0, getToken1, getPoolAddress, }) {
    return function tvlSelector(currencyA, currencyB, unorderedPoolsWithTvl) {
        const POOL_SELECTION_CONFIG = getPoolSelectorConfig(currencyA, currencyB);
        if (!currencyA || !currencyB || !unorderedPoolsWithTvl.length) {
            return [];
        }
        const poolsFromSubgraph = unorderedPoolsWithTvl.sort(sortByTvl);
        const { chainId } = getToken0(poolsFromSubgraph[0]);
        const baseTokens = (0, Constant_1.getCurrentAddressInfo)().getApi().tokenMangerApi().tradeTokens();
        const poolSet = new Set();
        const addToPoolSet = (pools) => {
            for (const pool of pools) {
                poolSet.add(getPoolAddress(pool));
            }
        };
        const topByBaseWithTokenIn = baseTokens
            .map((token) => {
            return poolsFromSubgraph
                .filter((subgraphPool) => {
                return ((getToken0(subgraphPool).wrapped.equals(token) &&
                    getToken1(subgraphPool).wrapped.equals(currencyA.wrapped)) ||
                    (getToken1(subgraphPool).wrapped.equals(token) &&
                        getToken0(subgraphPool).wrapped.equals(currencyA.wrapped)));
            })
                .sort(sortByTvl)
                .slice(0, POOL_SELECTION_CONFIG.topNWithEachBaseToken);
        })
            .reduce((acc, cur) => [...acc, ...cur], [])
            .sort(sortByTvl)
            .slice(0, POOL_SELECTION_CONFIG.topNWithBaseToken);
        addToPoolSet(topByBaseWithTokenIn);
        const topByBaseWithTokenOut = baseTokens
            .map((token) => {
            return poolsFromSubgraph
                .filter((subgraphPool) => {
                if (poolSet.has(getPoolAddress(subgraphPool))) {
                    return false;
                }
                return ((getToken0(subgraphPool).wrapped.equals(token) &&
                    getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
                    (getToken1(subgraphPool).wrapped.equals(token) &&
                        getToken0(subgraphPool).wrapped.equals(currencyB.wrapped)));
            })
                .sort(sortByTvl)
                .slice(0, POOL_SELECTION_CONFIG.topNWithEachBaseToken);
        })
            .reduce((acc, cur) => [...acc, ...cur], [])
            .sort(sortByTvl)
            .slice(0, POOL_SELECTION_CONFIG.topNWithBaseToken);
        addToPoolSet(topByBaseWithTokenOut);
        const top2DirectPools = poolsFromSubgraph
            .filter((subgraphPool) => {
            if (poolSet.has(getPoolAddress(subgraphPool))) {
                return false;
            }
            return ((getToken0(subgraphPool).wrapped.equals(currencyA.wrapped) &&
                getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
                (getToken1(subgraphPool).wrapped.equals(currencyA.wrapped) &&
                    getToken0(subgraphPool).wrapped.equals(currencyB.wrapped)));
        })
            .slice(0, POOL_SELECTION_CONFIG.topNDirectSwaps);
        addToPoolSet(top2DirectPools);
        const nativeToken = (0, Constant_1.getCurrentAddressInfo)().getApi().tokenMangerApi().WNATIVE();
        const top2EthBaseTokenPool = nativeToken
            ? poolsFromSubgraph
                .filter((subgraphPool) => {
                if (poolSet.has(getPoolAddress(subgraphPool))) {
                    return false;
                }
                return ((getToken0(subgraphPool).wrapped.equals(nativeToken) &&
                    getToken1(subgraphPool).wrapped.equals(currencyA.wrapped)) ||
                    (getToken1(subgraphPool).wrapped.equals(nativeToken) &&
                        getToken0(subgraphPool).wrapped.equals(currencyA.wrapped)));
            })
                .slice(0, 1)
            : [];
        addToPoolSet(top2EthBaseTokenPool);
        const top2EthQuoteTokenPool = nativeToken
            ? poolsFromSubgraph
                .filter((subgraphPool) => {
                if (poolSet.has(getPoolAddress(subgraphPool))) {
                    return false;
                }
                return ((getToken0(subgraphPool).wrapped.equals(nativeToken) &&
                    getToken1(subgraphPool).wrapped.equals(currencyB.wrapped)) ||
                    (getToken1(subgraphPool).wrapped.equals(nativeToken) &&
                        getToken0(subgraphPool).wrapped.equals(currencyB.wrapped)));
            })
                .slice(0, 1)
            : [];
        addToPoolSet(top2EthQuoteTokenPool);
        const topByTVL = poolsFromSubgraph
            .slice(0, POOL_SELECTION_CONFIG.topN)
            .filter((pool) => !poolSet.has(getPoolAddress(pool)));
        addToPoolSet(topByTVL);
        const topByTVLUsingTokenBase = poolsFromSubgraph
            .filter((subgraphPool) => {
            if (poolSet.has(getPoolAddress(subgraphPool))) {
                return false;
            }
            return (getToken0(subgraphPool).wrapped.equals(currencyA.wrapped) ||
                getToken1(subgraphPool).wrapped.equals(currencyA.wrapped));
        })
            .slice(0, POOL_SELECTION_CONFIG.topNTokenInOut);
        addToPoolSet(topByTVLUsingTokenBase);
        const topByTVLUsingTokenQuote = poolsFromSubgraph
            .filter((subgraphPool) => {
            if (poolSet.has(getPoolAddress(subgraphPool))) {
                return false;
            }
            return (getToken0(subgraphPool).wrapped.equals(currencyB.wrapped) ||
                getToken1(subgraphPool).wrapped.equals(currencyB.wrapped));
        })
            .slice(0, POOL_SELECTION_CONFIG.topNTokenInOut);
        addToPoolSet(topByTVLUsingTokenQuote);
        const getTopByTVLUsingTokenSecondHops = (base, tokenToCompare) => base
            .map((subgraphPool) => {
            return getToken0(subgraphPool).wrapped.equals(tokenToCompare.wrapped)
                ? getToken1(subgraphPool)
                : getToken0(subgraphPool);
        })
            .map((secondHopToken) => {
            return poolsFromSubgraph.filter((subgraphPool) => {
                if (poolSet.has(getPoolAddress(subgraphPool))) {
                    return false;
                }
                return (getToken0(subgraphPool).wrapped.equals(secondHopToken.wrapped) ||
                    getToken1(subgraphPool).wrapped.equals(secondHopToken.wrapped));
            });
        })
            .reduce((acc, cur) => [...acc, ...cur], [])
            // Uniq
            .reduce((acc, cur) => (acc.some((p) => p === cur) ? acc : [...acc, cur]), [])
            .sort(sortByTvl)
            .slice(0, POOL_SELECTION_CONFIG.topNSecondHop);
        const topByTVLUsingTokenInSecondHops = getTopByTVLUsingTokenSecondHops([...topByTVLUsingTokenBase, ...topByBaseWithTokenIn], currencyA);
        addToPoolSet(topByTVLUsingTokenInSecondHops);
        const topByTVLUsingTokenOutSecondHops = getTopByTVLUsingTokenSecondHops([...topByTVLUsingTokenQuote, ...topByBaseWithTokenOut], currencyB);
        addToPoolSet(topByTVLUsingTokenOutSecondHops);
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
        ];
        // eslint-disable-next-line
        return pools.map(({ tvlUSD, ...rest }) => rest);
    };
}
exports.v3PoolTvlSelector = poolSelectorFactory({
    getPoolSelectorConfig: (currencyA, currencyB) => exports.DEFAULT_POOL_SELECTOR_CONFIG,
    getToken0: (p) => p.token0,
    getToken1: (p) => p.token1,
    getPoolAddress: (p) => p.address,
});
exports.v2PoolTvlSelector = poolSelectorFactory({
    getPoolSelectorConfig: (currencyA, currencyB) => exports.V2_DEFAULT_POOL_SELECTOR_CONFIG,
    getToken0: (p) => p.reserve0.currency,
    getToken1: (p) => p.reserve1.currency,
    getPoolAddress: (p) => p.address,
});
