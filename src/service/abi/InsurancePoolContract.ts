import type { ConnectInfo } from '../../ConnectInfo'
import { InsurancePool } from '../../abi'
import { CacheKey, EnableLogs } from '../tool'
import type { TransactionEvent } from '../vo'
import { BaseAbi } from './BaseAbi'

@CacheKey('InsurancePoolContract')
export class InsurancePoolContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.launchpadInsurancePool as string, InsurancePool)
  }

  // function claimLoss(uint256 insuranceId) external;

  @EnableLogs()
  async claimLoss(insuranceId: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claimLoss', args)
  }
}
