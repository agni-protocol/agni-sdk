import type {ConnectInfo} from '../../ConnectInfo'
import {SwapRouter} from '../../abi'
import {ADDRESS_THIS, CacheKey, Currency, CurrencyAmount, EnableLogs, Percent, TradeType} from '../tool'
import {invariant} from '../tool/math/Common'
import type {BaseRoute, Route, SmartRouterTrade} from '../tool/v3route/types'
import {RouteType} from '../tool/v3route/types'
import {maximumAmountIn, minimumAmountOut} from '../tool/v3route/utils/maximumAmount'
import {getCurrentAddressInfo} from '../../Constant'
import type {Pool, TransactionEvent, V3Pool} from '../vo'
import {encodeMixedRouteToPath} from '../tool/math/SwapV3Math'
import {BaseAbi} from './BaseAbi'
import {getOutputCurrency, involvesCurrency, isV2Pool, isV3Pool} from "../tool/v3route/utils/pool";
import {buildBaseRoute} from "../tool/v3route/utils/route";

const partitionMixedRouteByProtocol = (route: Route): Pool[][] => {
  const acc: Pool[][] = []
  let left = 0
  let right = 0
  while (right < route.pools.length) {
    if (route.pools[left].type !== route.pools[right].type) {
      acc.push(route.pools.slice(left, right))
      left = right
    }
    // seek forward with right pointer
    right++
    if (right === route.pools.length) {
      /// we reached the end, take the rest
      acc.push(route.pools.slice(left, right))
    }
  }
  return acc
}
/**
 * Simple utility function to get the output of an array of Pools or Pairs
 * @param pools
 * @param firstInputToken
 * @returns the output token of the last pool in the array
 */
const getOutputOfPools = (pools: Pool[], firstInputToken: Currency): Currency => {
  const {inputToken: outputToken} = pools.reduce(
    ({inputToken}, pool: Pool): { inputToken: Currency } => {
      if (!involvesCurrency(pool, inputToken)) throw new Error('PATH')
      const output = getOutputCurrency(pool, inputToken)
      return {
        inputToken: output,
      }
    },
    {inputToken: firstInputToken},
  )
  return outputToken
}

@CacheKey('SwapRouterContract')
export class SwapRouterContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.swapRouter as string, SwapRouter)
  }

  private encodeV2Swap(
    trade: SmartRouterTrade<TradeType>,
    routerMustCustody: boolean,
    slippageTolerance: Percent,
    recipientAddr: string,
    performAggregatedSlippageCheck: boolean,
  ): string {
    const amountIn: bigint = maximumAmountIn(trade, slippageTolerance).quotient
    const amountOut: bigint = minimumAmountOut(trade, slippageTolerance).quotient

    // V2 trade should have only one route
    const route = trade.routes[0]
    const path = route.path.map((token) => token.wrapped.address)
    const recipient = routerMustCustody
      ? ADDRESS_THIS
      : recipientAddr
    if (trade.tradeType === TradeType.EXACT_INPUT) {
      const exactInputParams = [amountIn, performAggregatedSlippageCheck ? 0n : amountOut, path, recipient] as const
      return this.contract.interface.encodeFunctionData('swapExactTokensForTokens', exactInputParams)
    }
    const exactOutputParams = [amountOut, amountIn, path, recipient] as const
    return this.contract.interface.encodeFunctionData('swapTokensForExactTokens', exactOutputParams)
  }

  private encodeV3Swap(
    trade: SmartRouterTrade<TradeType>,
    routerMustCustody: boolean,
    slippageTolerance: Percent,
    recipientAddr: string,
    performAggregatedSlippageCheck: boolean,
    deadline: string | number,
  ): string[] {
    const calldatas: string[] = []
    for (const route of trade.routes) {
      const {inputAmount, outputAmount, pools, path} = route
      const amountIn: bigint = maximumAmountIn(trade, slippageTolerance, inputAmount).quotient
      const amountOut: bigint = minimumAmountOut(trade, slippageTolerance, outputAmount).quotient

      // flag for whether the trade is single hop or not
      const singleHop = pools.length === 1

      const recipient = routerMustCustody
        ? getCurrentAddressInfo().swapRouter
        : recipientAddr

      if (singleHop) {
        if (trade.tradeType === TradeType.EXACT_INPUT) {
          const exactInputSingleParams = {
            tokenIn: path[0].wrapped.address,
            tokenOut: path[1].wrapped.address,
            fee: (pools[0] as V3Pool).fee,
            recipient,
            deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
            amountIn,
            amountOutMinimum: performAggregatedSlippageCheck ? 0n : amountOut,
            sqrtPriceLimitX96: 0n,
          }

          calldatas.push(
            this.contract.interface.encodeFunctionData('exactInputSingle', [exactInputSingleParams]),
          )
        } else {
          const exactOutputSingleParams = {
            tokenIn: path[0].wrapped.address,
            tokenOut: path[1].wrapped.address,
            fee: (pools[0] as V3Pool).fee,
            recipient,
            deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
            amountOut,
            amountInMaximum: amountIn,
            sqrtPriceLimitX96: 0n,
          }

          calldatas.push(
            this.contract.interface.encodeFunctionData('exactOutputSingle', [exactOutputSingleParams]),
          )
        }
      } else {
        const pathStr = encodeMixedRouteToPath(
          {...route, input: inputAmount.currency, output: outputAmount.currency},
          trade.tradeType === TradeType.EXACT_OUTPUT,
        )

        if (trade.tradeType === TradeType.EXACT_INPUT) {
          const exactInputParams = {
            path: pathStr,
            recipient,
            deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
            amountIn,
            amountOutMinimum: performAggregatedSlippageCheck ? 0n : amountOut,
          }

          calldatas.push(
            this.contract.interface.encodeFunctionData('exactInput', [exactInputParams]),
          )
        } else {
          const exactOutputParams = {
            path: pathStr,
            recipient,
            deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
            amountOut,
            amountInMaximum: amountIn,
          }
          calldatas.push(
            this.contract.interface.encodeFunctionData('exactOutput', [exactOutputParams]),
          )
        }
      }
    }
    return calldatas
  }

  private encodeMixedRouteSwap(
    trade: SmartRouterTrade<TradeType>,
    routerMustCustody: boolean,
    slippageTolerance: Percent,
    recipientAddr: string,
    performAggregatedSlippageCheck: boolean,
    deadline: string | number,
  ): string[] {
    let calldatas: string[] = []
    const isExactIn = trade.tradeType === TradeType.EXACT_INPUT

    for (const route of trade.routes) {
      const {inputAmount, outputAmount, pools} = route
      const amountIn: bigint = maximumAmountIn(trade, slippageTolerance, inputAmount).quotient
      const amountOut: bigint = minimumAmountOut(trade, slippageTolerance, outputAmount).quotient

      // flag for whether the trade is single hop or not
      const singleHop = pools.length === 1

      const recipient = routerMustCustody
        ? ADDRESS_THIS
        : recipientAddr

      const mixedRouteIsAllV3 = (r: Omit<BaseRoute, 'input' | 'output'>) => {
        return r.pools.every(isV3Pool)
      }
      const mixedRouteIsAllV2 = (r: Omit<BaseRoute, 'input' | 'output'>) => {
        return r.pools.every(isV2Pool)
      }
      if (singleHop) {
        /// For single hop, since it isn't really a mixedRoute, we'll just mimic behavior of V3 or V2
        /// We don't use encodeV3Swap() or encodeV2Swap() because casting the trade to a V3Trade or V2Trade is overcomplex
        if (mixedRouteIsAllV3(route)) {
          calldatas = [
            ...calldatas,
            ...this.encodeV3Swap(
              {
                ...trade,
                routes: [route],
                inputAmount,
                outputAmount,
              },
              routerMustCustody,
              slippageTolerance,
              recipientAddr,
              performAggregatedSlippageCheck,
              deadline
            ),
          ]
        } else if (mixedRouteIsAllV2(route)) {
          calldatas = [
            ...calldatas,
            this.encodeV2Swap(
              {
                ...trade,
                routes: [route],
                inputAmount,
                outputAmount,
              },
              routerMustCustody,
              slippageTolerance,
              recipientAddr,
              performAggregatedSlippageCheck,
            ),
          ]
        } else {
          throw new Error('Unsupported route to encode')
        }
      } else {
        const sections = partitionMixedRouteByProtocol(route)
        const isLastSectionInRoute = (i: number) => {
          return i === sections.length - 1
        }

        let outputToken
        let inputToken = inputAmount.currency.wrapped

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]
          /// Now, we get output of this section
          outputToken = getOutputOfPools(section, inputToken)

          const newRoute = buildBaseRoute([...section], inputToken, outputToken)

          /// Previous output is now input
          inputToken = outputToken.wrapped

          const lastSectionInRoute = isLastSectionInRoute(i)
          // By default router holds funds until the last swap, then it is sent to the recipient
          // special case exists where we are unwrapping WETH output, in which case `routerMustCustody` is set to true
          // and router still holds the funds. That logic bundled into how the value of `recipient` is calculated
          const recipientAddress = lastSectionInRoute ? recipient : ADDRESS_THIS
          const inAmount = i === 0 ? amountIn : 0n
          const outAmount = !lastSectionInRoute ? 0n : amountOut
          if (mixedRouteIsAllV3(newRoute)) {
            const pathStr = encodeMixedRouteToPath(newRoute, !isExactIn)
            if (isExactIn) {
              const exactInputParams = {
                path: pathStr,
                recipient: recipientAddress,
                amountIn: inAmount,
                amountOutMinimum: outAmount,
              }
              calldatas.push(
                this.contract.interface.encodeFunctionData('exactInput', [exactInputParams]),
              )
            } else {
              const exactOutputParams = {
                path: pathStr,
                recipient,
                amountOut: outAmount,
                amountInMaximum: inAmount,
              }
              calldatas.push(
                this.contract.interface.encodeFunctionData('exactOutput', [exactOutputParams]),
              )
            }
          } else if (mixedRouteIsAllV2(newRoute)) {
            const path = newRoute.path.map((token) => token.wrapped.address)
            if (isExactIn) {
              const exactInputParams = [
                inAmount, // amountIn
                outAmount, // amountOutMin
                path, // path
                recipientAddress, // to
              ] as const
              calldatas.push(
                this.contract.interface.encodeFunctionData('swapExactTokensForTokens', [exactInputParams]),
              )
            } else {
              const exactOutputParams = [outAmount, inAmount, path, recipientAddress] as const
              calldatas.push(
                this.contract.interface.encodeFunctionData('swapTokensForExactTokens', [exactOutputParams]),
              )
            }
          } else {
            throw new Error('Unsupported route')
          }
        }
      }
    }
    return calldatas
  }


  @EnableLogs()
  async swap(trades: SmartRouterTrade<TradeType>[], slippageTolerance: Percent, recipientAddr: string, deadline: string | number, gasPriceGWei: string): Promise<TransactionEvent> {
    const numberOfTrades = trades.reduce((numOfTrades, trade) => numOfTrades + trade.routes.length, 0)

    const sampleTrade = trades[0]

    // All trades should have the same starting/ending currency and trade type
    invariant(
      trades.every(trade => trade.inputAmount.currency.equals(sampleTrade.inputAmount.currency)),
      'TOKEN_IN_DIFF',
    )
    invariant(
      trades.every(trade => trade.outputAmount.currency.equals(sampleTrade.outputAmount.currency)),
      'TOKEN_OUT_DIFF',
    )
    invariant(
      trades.every(trade => trade.tradeType === sampleTrade.tradeType),
      'TRADE_TYPE_DIFF',
    )

    const calldatas: string[] = []

    const inputIsNative = sampleTrade.inputAmount.currency.isNative
    const outputIsNative = sampleTrade.outputAmount.currency.isNative

    // flag for whether we want to perform an aggregated slippage check
    //   1. when there are >2 exact input trades. this is only a heuristic,
    //      as it's still more gas-expensive even in this case, but has benefits
    //      in that the reversion probability is lower
    const performAggregatedSlippageCheck = sampleTrade.tradeType === TradeType.EXACT_INPUT && numberOfTrades > 2
    // flag for whether funds should be send first to the router
    //   1. when receiving ETH (which much be unwrapped from WETH)
    //   2. when a fee on the output is being taken
    //   3. when performing swap and add
    //   4. when performing an aggregated slippage check
    const routerMustCustody = outputIsNative || performAggregatedSlippageCheck

    for (const trade of trades) {
      if (trade.routes.every(r => r.type === RouteType.V2)) {
        calldatas.push(
          ...this.encodeV2Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck),
        )
      } else if (trade.routes.every(r => r.type === RouteType.V3)) {
        calldatas.push(
          ...this.encodeV3Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline),
        )
      } else {
        calldatas.push(
          ...this.encodeMixedRouteSwap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline),
        )
      }
    }

    const ZERO_IN: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(sampleTrade.inputAmount.currency, 0)
    const ZERO_OUT: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(sampleTrade.outputAmount.currency, 0)

    const minAmountOut: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(minimumAmountOut(trade, slippageTolerance)),
      ZERO_OUT,
    )

    const totalAmountIn: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(maximumAmountIn(trade, slippageTolerance)),
      ZERO_IN,
    )

    // unwrap or sweep
    if (routerMustCustody) {
      if (outputIsNative) {
        calldatas.push(
          this.contract.interface.encodeFunctionData('unwrapWMNT', [minAmountOut.quotient, recipientAddr]),
        )
      } else {
        calldatas.push(
          this.contract.interface.encodeFunctionData('sweepToken', [sampleTrade.outputAmount.currency.wrapped.erc20Address(), minAmountOut.quotient, recipientAddr]),
        )
      }
    }
    if (inputIsNative) {
      calldatas.push(
        this.contract.interface.encodeFunctionData('refundMNT', []),
      )
    }
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'multicall', [calldatas], {
      gasPrice: gasPriceGWei,
      value: inputIsNative ? totalAmountIn.quotient.toString() : '0',
    })
  }
}
