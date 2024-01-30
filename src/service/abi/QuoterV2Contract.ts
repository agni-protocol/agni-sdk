import type { ConnectInfo } from '../../ConnectInfo'
import { IQuoterV2 } from '../../abi'
import { CacheKey } from '../tool'
import { BaseAbi } from './BaseAbi'

@CacheKey('QuoterV2Contract')
export class QuoterV2Contract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.quoterV2 as string, IQuoterV2)
  }
}
