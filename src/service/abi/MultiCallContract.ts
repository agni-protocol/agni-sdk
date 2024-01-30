import fromPairs from 'lodash/fromPairs'
import toPairs from 'lodash/toPairs'
import { CacheKey } from '../tool'
import type { ConnectInfo } from '../../ConnectInfo'
import { Multicall2 } from '../../abi'

import type { ContractCall } from '../../mulcall'
import { multicallExecute } from '../../mulcall'
import { BaseAbi } from './BaseAbi'

export type ShapeWithLabel = Record<string, ContractCall | string>

@CacheKey('MultiCallContract')
export class MultiCallContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.multicall as string, Multicall2)
  }

  async singleCall<T = any>(shapeWithLabel: ShapeWithLabel): Promise<T> {
    const [res] = await this.call(...[shapeWithLabel])
    return res as T
  }

  async call<T = any[]>(...shapeWithLabels: ShapeWithLabel[]): Promise<T> {
    if (shapeWithLabels.length === 0) {
      return [] as any
    }
    const calls: ContractCall[] = []
    shapeWithLabels.forEach((relay) => {
      const pairs = toPairs(relay)
      pairs.forEach(([, value]) => {
        if (typeof value !== 'string')
          calls.push(value)
      })
    })
    const res = await multicallExecute(this.contract, calls)
    let index = 0
    const datas = shapeWithLabels.map((relay) => {
      const pairs = toPairs(relay)
      pairs.forEach((obj) => {
        if (typeof obj[1] !== 'string') {
          obj[1] = res[index]
          index++
        }
      })
      return fromPairs(pairs) as any
    })
    return datas as T
  }
}
