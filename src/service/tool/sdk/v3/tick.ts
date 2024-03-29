import type { BigintIsh } from '../constants'
import { invariant } from '../../math/Common'
import { TickMath } from './utils'

export interface TickConstructorArgs {
  index: number
  liquidityGross: BigintIsh
  liquidityNet: BigintIsh
}

export class Tick {
  public readonly index: number

  public readonly liquidityGross: bigint

  public readonly liquidityNet: bigint

  constructor({ index, liquidityGross, liquidityNet }: TickConstructorArgs) {
    invariant(index >= TickMath.MIN_TICK && index <= TickMath.MAX_TICK, 'TICK')
    this.index = index
    this.liquidityGross = BigInt(liquidityGross)
    this.liquidityNet = BigInt(liquidityNet)
  }
}
