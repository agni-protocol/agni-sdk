import type { ConnectInfo } from '../../ConnectInfo'
import { IdoPool } from '../../abi'
import { CacheKey } from '../tool'
import type { TransactionEvent } from '../vo'
import { BaseAbi } from './BaseAbi'

@CacheKey('IdoPoolContract')
export class IdoPoolContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo, address: string) {
    super(connectInfo, address, IdoPool)
  }

  async enroll(): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'enroll', args)
  }

  async presaleDeposit(buyQuota: string, buyInsurance: boolean): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'presaleDeposit', args)
  }

  async publicSaleDeposit(buyInsurance: boolean, buyQuota: string, extraDeposit: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'publicSaleDeposit', args)
  }

  async claim(): Promise<TransactionEvent> {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claim')
  }
}
