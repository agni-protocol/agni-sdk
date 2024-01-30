export interface PoolSelectorConfig {
  topN: number
  topNDirectSwaps: number
  topNTokenInOut: number
  topNSecondHop: number
  topNWithEachBaseToken: number
  topNWithBaseToken: number
}

export interface PoolSelectorConfigChainMap {
  [chain: number]: PoolSelectorConfig
}

export interface TokenSpecificPoolSelectorConfig {
  [tokenAddress: string]: Partial<PoolSelectorConfig>
}

export interface TokenPoolSelectorConfigChainMap {
  [chain: number]: TokenSpecificPoolSelectorConfig
}
