/**
 * ABI
 */
import type { JsonFragment } from 'ethers'
import IERC20Abi from './IERC20.json'
import Multicall2Abi from './Multicall2.json'
import IAgniPoolAbi from './core/IAgniPool.json'
import INonfungiblePositionManagerAbi from './periphery/INonfungiblePositionManager.json'
import IQuoterV2Abi from './periphery/IQuoterV2.json'
import IStakingPoolAbi from './launchpad/IStakingPool.json'
import InsurancePoolAbi from './launchpad/IInsurancePool.json'
import IIdoPoolAbi from './launchpad/IIdoPool.json'
import GasLimitMulticallAbi from './GasLimitMulticall.json'
import RUSDYAbi from './RUSDY.json'
import WETHAbi from './WETH.json'
import ISwapRouter from './periphery/ISwapRouter.json'
import AgniProjectPartyRewardAbi from './AgniProjectPartyReward.json'
import MixedRouteQuoterV1Abi from './mixedRouteQuoterV1.json'

export const IERC20 = IERC20Abi as JsonFragment[]
export const Multicall2 = Multicall2Abi as JsonFragment[]
export const IAgniPool = IAgniPoolAbi as JsonFragment[]
export const INonfungiblePositionManager = INonfungiblePositionManagerAbi as JsonFragment[]
export const IStakingPool = IStakingPoolAbi as JsonFragment[]
export const InsurancePool = InsurancePoolAbi as JsonFragment[]
export const IdoPool = IIdoPoolAbi as JsonFragment[]
export const IQuoterV2 = IQuoterV2Abi as JsonFragment[]
export const GasLimitMulticall = GasLimitMulticallAbi as JsonFragment[]
export const SwapRouter = ISwapRouter as JsonFragment[]
export const RUSDY = RUSDYAbi as JsonFragment[]
export const WETH = WETHAbi as JsonFragment[]
export const AgniProjectPartyReward = AgniProjectPartyRewardAbi as JsonFragment[]
export const MixedRouteQuoterV1 = MixedRouteQuoterV1Abi as JsonFragment[]
