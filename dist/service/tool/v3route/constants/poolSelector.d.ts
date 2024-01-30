import type { PoolSelectorConfig } from '../types';
import type { Currency } from '../../sdk';
import type { V2PoolWithTvl, V3PoolWithTvl } from '../../../vo';
export declare const DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfig;
export declare const V2_DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfig;
export declare const v3PoolTvlSelector: (currencyA: Currency | undefined, currencyB: Currency | undefined, unorderedPoolsWithTvl: V3PoolWithTvl[]) => Omit<V3PoolWithTvl, "tvlUSD">[];
export declare const v2PoolTvlSelector: (currencyA: Currency | undefined, currencyB: Currency | undefined, unorderedPoolsWithTvl: V2PoolWithTvl[]) => Omit<V2PoolWithTvl, "tvlUSD">[];
