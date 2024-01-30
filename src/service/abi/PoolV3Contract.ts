import type { ConnectInfo } from '../../ConnectInfo'
import { IAgniPool } from '../../abi'
import { CacheKey } from '../tool'
import { BaseAbi } from './BaseAbi'

@CacheKey('PoolV3Contract')
export class PoolV3Contract extends BaseAbi {
  constructor(connectInfo: ConnectInfo, poolAddress: string) {
    super(connectInfo, poolAddress, IAgniPool)
  }
}
