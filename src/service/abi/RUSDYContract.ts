import BigNumber from 'bignumber.js'
import type { ConnectInfo } from '../../ConnectInfo'
import { RUSDY } from '../../abi'
import { CacheKey, EnableLogs } from '../tool'
import type { TransactionEvent } from '../vo'
import { BaseAbi } from './BaseAbi'

@CacheKey('RUSDYContract')
export class RUSDYContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.RUSDY, RUSDY)
  }

  BPS_DENOMINATOR = 10000

  @EnableLogs()
  async wrap(amount: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'wrap', args)
  }

  @EnableLogs()
  async unwrap(amount: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'unwrap', args)
  }

  async getRUSDYByShares(_USDYAmount: string): Promise<string> {
    const amount = new BigNumber(_USDYAmount).multipliedBy(1e18).multipliedBy(this.BPS_DENOMINATOR).toFixed()
    return new BigNumber(this.contract.getRUSDYByShares(amount).toString()).div(1e18).toFixed()
  }

  async getSharesByRUSDY(_rUSDYAmount: string): Promise<string> {
    const amount = new BigNumber(_rUSDYAmount).multipliedBy(1e18).toFixed()
    return new BigNumber(this.contract.getSharesByRUSDY(amount).toString()).div(1e18).div(this.BPS_DENOMINATOR).toFixed()
  }
}
