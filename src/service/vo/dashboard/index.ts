export interface Block {
  number: number
  timestamp: string
}

export interface DashboardPoolFields {
  id: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  tick: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token0Price: string
  token1Price: string
  volumeUSD: string
  volumeToken0: string
  volumeToken1: string
  txCount: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUSD: string
  feesUSD: string
  protocolFeesUSD: string
}

export interface DashboardPoolDataResponse {
  pools: DashboardPoolFields[]
  bundles: {
    ethPriceUSD: string
  }[]
}

export interface DashboardPoolData {
  // basic token info
  address: string
  feeTier: number

  token0: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number

  // 24h fees
  feeUSD: number
}

export interface DashboardTokenFields {
  id: string
  symbol: string
  name: string
  derivedETH: string
  derivedUSD: string
  volumeUSD: string
  volume: string
  feesUSD: string
  txCount: string
  totalValueLocked: string
  totalValueLockedUSD: string
}

export interface DashboardTokenDataResponse {
  tokens: DashboardTokenFields[]
}

export interface DashboardTokenData {
  // token is in some pool on uniswap
  exists: boolean

  // basic token info
  name: string
  symbol: string
  address: string

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number
  txCount: number

  // fees
  feesUSD: number

  // tvl
  tvlToken: number
  tvlUSD: number
  tvlUSDChange: number

  priceUSD: number
  priceUSDChange: number
  priceUSDChangeWeek: number
}

export interface DashboardPricesResponse {
  current: {
    ethPriceUSD: string
  }[]
  oneDay: {
    ethPriceUSD: string
  }[]
  twoDay: {
    ethPriceUSD: string
  }[]
  oneWeek: {
    ethPriceUSD: string
  }[]
}

export interface DashboardGlobalResponse {
  factories: {
    txCount: string
    totalVolumeUSD: string
    totalFeesUSD: string
    totalValueLockedUSD: string
    totalProtocolFeesUSD: string
  }[]
}

export interface DashboardProtocolData {
  // volume
  volumeUSD: number
  totalVolumeUSD: number
  volumeUSDChange: number

  // in range liquidity
  tvlUSD: number
  tvlUSDChange: number

  // fees
  feesUSD: number
  feeChange: number

  // transactions
  txCount: number
  txCountChange: number
}

export interface DashboardChartResults {
  pancakeDayDatas: {
    date: number
    volumeUSD: string
    tvlUSD: string
  }[]
}

export interface DashboardChartDayData {
  date: number
  volumeUSD: number
  tvlUSD: number
}

export enum DashboardTransactionType {
  SWAP,
  MINT,
  BURN,
}

export interface DashboardTransaction {
  type: DashboardTransactionType
  hash: string
  timestamp: string
  sender: string
  token0Symbol: string
  token1Symbol: string
  token0Address: string
  token1Address: string
  amountUSD: number
  amountToken0: number
  amountToken1: number
}

export interface DashboardTransactionEntry {
  mints: {
    timestamp: string
    id: string
    token0: {
      id: string
      symbol: string
    }
    token1: {
      id: string
      symbol: string
    }
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
  swaps: {
    timestamp: string
    id: string
    token0: {
      id: string
      symbol: string
    }
    token1: {
      id: string
      symbol: string
    }
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
  burns: {
    timestamp: string
    id: string
    token0: {
      id: string
      symbol: string
    }
    token1: {
      id: string
      symbol: string
    }
    owner: string
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
}
