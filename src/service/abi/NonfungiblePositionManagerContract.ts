import BigNumber from 'bignumber.js'
import type { ConnectInfo } from '../../ConnectInfo'
import { INonfungiblePositionManager } from '../../abi'
import type { Percent, Token } from '../tool'
import { CacheKey, EnableLogs, ZERO, ZERO_ADDRESS, isNullOrUndefined } from '../tool'
import type { Position } from '../tool/sdk/v3'
import { invariant } from '../tool/math/Common'
import type { TransactionEvent } from '../vo'
import { ETH_ADDRESS } from '../vo'
import { BaseAbi } from './BaseAbi'

const MaxUint128 = 2n ** 128n - 1n

@CacheKey('NonfungiblePositionManagerContract')
export class NonfungiblePositionManagerContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.nonfungiblePositionManager as string, INonfungiblePositionManager)
  }

  async collect(tokenId: string, token0: Token, token1: Token, fee0: string, fee1: string, involvesMNT: boolean): Promise<TransactionEvent> {
    const calldatas: string[] = []
    const involvesETH = involvesMNT && (token0.address === ETH_ADDRESS || token1.address === ETH_ADDRESS)
    // collect
    const account = this.connectInfo.account
    calldatas.push(
      this.contract.interface.encodeFunctionData('collect', [{
        tokenId,
        recipient: involvesETH ? ZERO_ADDRESS : account,
        amount0Max: MaxUint128.toString(),
        amount1Max: MaxUint128.toString(),
      }]),
    )

    if (involvesETH) {
      const ethAmount = token0.address === ETH_ADDRESS
        ? fee0
        : fee1
      const token = token0.address === ETH_ADDRESS
        ? token1
        : token0
      const tokenAmount = token0.address === ETH_ADDRESS
        ? fee1
        : fee0
      calldatas.push(
        this.contract.interface.encodeFunctionData('unwrapWMNT', [ethAmount, account]),
      )
      calldatas.push(
        this.contract.interface.encodeFunctionData('sweepToken', [token.erc20Address(), tokenAmount, account]),
      )
    }
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'multicall', [calldatas])
  }

  @EnableLogs()
  async addLiquidity(position: Position, tokenId: string | undefined, createPool: boolean, slippageTolerance: Percent, deadline: number): Promise<TransactionEvent> {
    invariant(position.liquidity > ZERO, 'ZERO_LIQUIDITY')

    const recipient = this.connectInfo.account
    const calldatas: string[] = []

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(slippageTolerance)
    const amount0Min = minimumAmounts.amount0
    const amount1Min = minimumAmounts.amount1
    // create pool if needed
    if (createPool) {
      calldatas.push(
        this.contract.interface.encodeFunctionData('createAndInitializePoolIfNecessary', [
          position.pool.token0.erc20Address(),
          position.pool.token1.erc20Address(),
          position.pool.fee,
          position.pool.sqrtRatioX96,
        ]),
      )
    }

    if (!isNullOrUndefined(tokenId)) {
      calldatas.push(
        this.contract.interface.encodeFunctionData('increaseLiquidity', [
          {
            tokenId: BigInt(tokenId),
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            deadline,
          },
        ]),
      )
    }
    else {
      calldatas.push(
        this.contract.interface.encodeFunctionData('mint', [{
          token0: position.pool.token0.erc20Address(),
          token1: position.pool.token1.erc20Address(),
          fee: position.pool.fee,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
          amount0Desired,
          amount1Desired,
          amount0Min,
          amount1Min,
          recipient,
          deadline,
        }]),
      )
    }
    let value = '0'
    if (position.pool.token0.isNative || position.pool.token1.isNative) {
      const wrapped = position.pool.token0.isNative ? position.pool.token0 : position.pool.token1.isNative ? position.pool.token1 : undefined
      const wrappedValue = position.pool.token0.equals(wrapped as Token) ? amount0Desired : amount1Desired
      // we only need to refund if we're actually sending ETH
      if (wrappedValue > ZERO)
        calldatas.push(this.contract.interface.encodeFunctionData('refundMNT', []))

      value = wrappedValue.toString()
    }
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'multicall', [calldatas], {
      value,
    })
  }

  @EnableLogs()
  async removeLiquidity(rate: string, token0: Token, token1: Token, partialPosition: Position, tokenId: string, fee0: string, fee1: string, involvesMNT: boolean, slippageTolerance: Percent, deadline: number) {
    const calldatas: string[] = []
    invariant(partialPosition.liquidity > ZERO, 'ZERO_LIQUIDITY')
    // slippage-adjusted underlying amounts
    const { amount0: amount0Min, amount1: amount1Min } = partialPosition.burnAmountsWithSlippage(
      slippageTolerance,
    )

    // remove liquidity
    calldatas.push(
      this.contract.interface.encodeFunctionData('decreaseLiquidity', [
        {
          tokenId,
          liquidity: partialPosition.liquidity,
          amount0Min,
          amount1Min,
          deadline,
        },
      ]),
    )

    const involvesETH = involvesMNT && (token0.address === ETH_ADDRESS || token1.address === ETH_ADDRESS)
    // collect
    const account = this.connectInfo.account
    calldatas.push(
      this.contract.interface.encodeFunctionData('collect', [{
        tokenId,
        recipient: involvesETH ? ZERO_ADDRESS : account,
        amount0Max: MaxUint128.toString(),
        amount1Max: MaxUint128.toString(),
      }]),
    )

    if (involvesETH) {
      const ethAmount = token0.address === ETH_ADDRESS
        ? new BigNumber(fee0).multipliedBy(amount0Min.toString()).toFixed(0, BigNumber.ROUND_DOWN)
        : new BigNumber(fee1).multipliedBy(amount1Min.toString()).toFixed(0, BigNumber.ROUND_DOWN)
      const token = token0.address === ETH_ADDRESS
        ? token1
        : token0
      const tokenAmount = token0.address === ETH_ADDRESS
        ? new BigNumber(fee1).multipliedBy(amount1Min.toString()).toFixed(0, BigNumber.ROUND_DOWN)
        : new BigNumber(fee0).multipliedBy(amount0Min.toString()).toFixed(0, BigNumber.ROUND_DOWN)
      calldatas.push(
        this.contract.interface.encodeFunctionData('unwrapWMNT', [ethAmount, account]),
      )
      calldatas.push(
        this.contract.interface.encodeFunctionData('sweepToken', [token.erc20Address(), tokenAmount, account]),
      )
    }

    if (new BigNumber(rate).comparedTo('100') >= 0) {
      calldatas.push(
        this.contract.interface.encodeFunctionData('burn', [tokenId]),
      )
    }
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'multicall', [calldatas])
  }
}
