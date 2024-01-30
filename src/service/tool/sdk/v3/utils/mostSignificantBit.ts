import { ZERO } from '../internalConstants'
import { invariant } from '../../../math/Common'
import { MaxUint256 } from '../../constants'

const TWO = 2n
const POWERS_OF_2 = [128, 64, 32, 16, 8, 4, 2, 1].map((pow: number): [number, bigint] => [pow, TWO ** BigInt(pow)])

export function mostSignificantBit(x: bigint): number {
  invariant(x > ZERO, 'ZERO')
  invariant(x <= MaxUint256, 'MAX')

  let msb = 0
  for (const [power, min] of POWERS_OF_2) {
    if (x >= min) {
      x = x >> BigInt(power)
      msb += power
    }
  }
  return msb
}
