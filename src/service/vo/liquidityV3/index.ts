import type { BalanceAndAllowance } from '../Types'
import type { TransactionEvent } from '../TransactionEvent'
import type { ConnectInfo } from '../../../ConnectInfo'
import type { TokenPrice } from '../tokenlist'
import type { Pool } from '../../tool/sdk/v3'
import {Token} from "../../tool/sdk";

/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MEDIUM = 2500,
  HIGH = 10000,
}

/**
 * The default factory tick spacings by fee amount.
 */
export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 50,
  [FeeAmount.HIGH]: 200,
}

export interface PoolState {
  feeAmount: FeeAmount
  pick: number // 百分比
  state: 'no create' | 'create'
}

export interface TickData {
  tick: number
  liquidityNet: string
  liquidityGross: string
}

export interface TickProcessed {
  tick: number
  liquidityActive: bigint
  liquidityNet: bigint
  price0: string
}

export class AddLiquidityV3Info {
  public poolState: PoolState[]

  public token0: Token
  public token1: Token
  public token0Balance: BalanceAndAllowance
  public token1Balance: BalanceAndAllowance

  // 会变化的数据
  // fee tier
  public feeAmount: FeeAmount
  public token0Amount: string = ''
  public token1Amount: string = ''

  // Set Starting Price
  public first: boolean
  public firstPrice: string
  public minPrice: string
  public maxPrice: string
  public pool: Pool
  public rate: '10' | '20' | '50' | 'full'

  // 无需关心的数据
  public tickLower: number
  public tickUpper: number

  public tickData: {
    tickDatas: TickData[]
    ticksProcessed: TickProcessed[]
  }

  public updateFeeAmount: (feeAmount: FeeAmount) => void
  public updateAllTickInfo: () => Promise<{
    tickDatas: TickData[]
    ticksProcessed: TickProcessed[]
  }>

  public updateToken0: (amount: string) => string
  public updateToken1: (amount: string) => string

  public checkFirstPrice: (inputFirstPrice: string) => (boolean)
  public updateFirstPrice: (inputFirstPrice: string) => void

  public setPriceRange: (minPrice: string | boolean, maxPrice: string | boolean) => {
    minPrice: string
    maxPrice: string
  }

  public setRate: (rate: '10' | '20' | '50' | 'full') => {
    minPrice: string
    maxPrice: string
  }

  public addLiquidity: (connect: ConnectInfo, allowedSlippage: string, deadline: string | number) => Promise<TransactionEvent>
}

export interface PositionContractDetails {
  nonce: string
  tokenId: string
  operator: string
  token0: string
  token1: string
  fee: string
  tickLower: string
  tickUpper: string
  liquidity: string
  feeGrowthInside0LastX128: string
  feeGrowthInside1LastX128: string
  tokensOwed0: string
  tokensOwed1: string
}

export class LiquidityListData {
  tokenId: string
  token0: Token
  token1: Token
  feeAmount: FeeAmount
  minPrice: string
  maxPrice: string
  currentPrice: string
  reverseCurrentPrice: string
  reverseMinPrice: string
  reverseMaxPrice: string
  state: 'active' | 'close' | 'inactive'
  liquidity: string
}

export class LiquidityInfo extends LiquidityListData {
  token0Balance: BalanceAndAllowance
  token1Balance: BalanceAndAllowance
  token0Price: TokenPrice
  token1Price: TokenPrice
  token0USD: string
  token1USD: string
  liquidityUSD: string
  apr: string
  collectToken0: string
  collectToken1: string
  collectToken0USD: string
  collectToken1USD: string
  collectUSD: string
  token0Amount: string
  token1Amount: string

  histories: LiquidityHistory[]

  collectFee: (connect: ConnectInfo, involvesMNT: boolean) => Promise<TransactionEvent>

  preRemoveLiquidity: (rate: string) => {
    amount0: string
    amount1: string
  }

  removeLiquidity: (connect: ConnectInfo, rate: string, involvesMNT: boolean, allowedSlippage: string, deadline: number | string) => Promise<TransactionEvent>

  preAddLiquidity: (inputToken: Token, inputAmount: string) => {
    amount0: string
    amount1: string
  }

  addLiquidity: (connect: ConnectInfo, amount0: string, amount1: string, allowedSlippage: string, deadline: number | string) => Promise<TransactionEvent>
}

export interface LiquidityHistory {
  time: number
  txUrl: string
  type: 'add' | 'remove' | 'collect_fee'
  token0Amount: string
  token1Amount: string
}
