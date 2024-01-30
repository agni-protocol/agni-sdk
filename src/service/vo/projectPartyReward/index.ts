import type { ConnectInfo } from '../../../ConnectInfo'
import type { TransactionEvent } from '../TransactionEvent'

export interface ProjectPartyReward {
  currentEpoch: number
  contractAddress: string
  startTime: number
  epochTime: number
  epochCount: number
  pools: ProjectPartyRewardPoolApiResult[]
}

export interface ProjectPartyRewardPoolApiResult {
  epoch: number
  poolAddress: string
  userAddress: string
  userCount: number
  tvlUsd: string
  volumeUsd: string
  score: string
}

export interface ProjectPartyUserLp {
  poolAddress: string
  userAddress: string
  tokenIds: string[]
  token0: string
  token1: string
  token0Symbol: string
  token1Symbol: string
}

export interface ProjectPartyRewardClaim {
  id: string
  timestamp: string
  hash: string
  epoch: string
  amount: string
  user: string
}

export interface ProjectPartyRewardInfo {

  infos: {
    claim: boolean
    amount: string
    epoch: string
  }[]
  rewardTotal: string
  availableReward: string
  claimTotal: string

  claim: boolean
  amount: string
  epoch: string
}

export class ProjectPartyRewardResult {
  currentEpoch: number
  startTime: number
  epochTime: number
  epochCount: number

  list: ProjectPartyRewardPool[]

  my: ProjectPartyRewardMyListResult
}


export interface ProjectPartyRewardPool extends ProjectPartyRewardPoolApiResult {
  token0Symbol: string
  token1Symbol: string
  feeTier: string
}

export interface ProjectPartyRewardUserPool extends ProjectPartyRewardPool {
  token0Stake: string
  token1Stake: string
}


export class ProjectPartyRewardMyListResult {
  totalReward: string
  unClaim: string
  pools: ProjectPartyRewardUserPool[]
  histories: {
    epoch: string
    amount: string
    timestamp: number
    hash: string
    claim: boolean
  }[]

  claim: (connect: ConnectInfo) => Promise<TransactionEvent>
}
