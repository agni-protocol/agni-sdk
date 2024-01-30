import type { ConnectInfo } from '../../ConnectInfo'
import { IStakingPool } from '../../abi'
import { CacheKey, EnableLogs } from '../tool'
import type { TransactionEvent } from '../vo'
import { BaseAbi } from './BaseAbi'

@CacheKey('StakingPoolContract')
export class StakingPoolContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.launchpadStakePool as string, IStakingPool)
  }

  @EnableLogs()
  async stakeNativeToken(tokenIdOrAmount: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'stakeNativeToken', [], { value: tokenIdOrAmount })
  }

  @EnableLogs()
  async unstake(stakeIds: string[]): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'unstake', args)
  }
}
