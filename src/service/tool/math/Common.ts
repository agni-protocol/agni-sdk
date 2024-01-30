import { getAddress } from 'ethers'
import type { Token } from '../sdk'
import { Price } from '../sdk'
import type { FeeAmount, TickData, TickProcessed } from '../../vo'
import { TICK_SPACINGS } from '../../vo'
import { TickMath, encodeSqrtRatioX96, nearestUsableTick, priceToClosestTick, tickToPrice } from '../sdk/v3/utils'

export function invariant(state: boolean, errorMsg: string = 'ERROR') {
  if (!state)
    throw new Error(errorMsg)
}

export const ENDLESS = '∞'

export function tryParsePrice(baseToken?: Token, quoteToken?: Token, value?: string) {
  if (!baseToken || !quoteToken || !value)
    return undefined

  if (!value.match(/^\d*\.?\d+$/))
    return undefined

  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    BigInt(10 ** decimals) * BigInt(10 ** baseToken.decimals),
    withoutDecimals * BigInt(10 ** quoteToken.decimals),
  )
}

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string,
): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value)
    return undefined

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price)
    return undefined

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (sqrtRatioX96 >= TickMath.MAX_SQRT_RATIO) {
    tick = TickMath.MAX_TICK
  }
  else if (sqrtRatioX96 <= TickMath.MIN_SQRT_RATIO) {
    tick = TickMath.MIN_TICK
  }
  else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}

export function getTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): Price<Token, Token> | undefined {
  if (!baseToken || !quoteToken || typeof tick !== 'number')
    return undefined

  return tickToPrice(baseToken, quoteToken, tick)
}

export function validateAndParseAddress(address: string): string {
  try {
    return getAddress(address)
  }
  catch (error) {
    invariant(false, `${address} is not a valid address.`)
  }
}

export function computeSurroundingTicks(
  token0: Token,
  token1: Token,
  activeTickProcessed: TickProcessed,
  sortedTickData: TickData[],
  pivot: number,
  ascending: boolean,
): TickProcessed[] {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  }
  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  let processedTicks: TickProcessed[] = []
  for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
    const tick = Number(sortedTickData[i].tick)
    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tick,
      liquidityNet: BigInt(sortedTickData[i].liquidityNet),
      price0: tickToPrice(token0, token1, tick).toFixed(),
    }

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    if (ascending) {
      currentTickProcessed.liquidityActive
        = previousTickProcessed.liquidityActive + BigInt(sortedTickData[i].liquidityNet)
    }
    else if (!ascending && previousTickProcessed.liquidityNet !== 0n) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = previousTickProcessed.liquidityActive - previousTickProcessed.liquidityNet
    }

    processedTicks.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (!ascending)
    processedTicks = processedTicks.reverse()

  return processedTicks
}

export function tickToPriceString(token0: Token, token1: Token, feeAmount: FeeAmount, tick: number): string {
  const min = nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount])
  const max = nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount])

  if (tick === min)
    return '0'

  if (tick === max)
    return ENDLESS

  return tickToPrice(token0, token1, tick).toFixed()
}
