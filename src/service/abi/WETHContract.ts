import type { ConnectInfo } from '../../ConnectInfo'
import { WETH } from '../../abi'
import { CacheKey, EnableLogs } from '../tool'
import type { TransactionEvent } from '../vo'
import { BaseAbi } from './BaseAbi'

@CacheKey('WETHContract')
export class WETHContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.WMNT, WETH)
  }

  @EnableLogs()
  async deposit(amount: string): Promise<TransactionEvent> {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'deposit', [], { value: amount })
  }

  @EnableLogs()
  async withdraw(amount: string): Promise<TransactionEvent> {
    // eslint-disable-next-line prefer-rest-params
    const args = Array.from(arguments)
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'withdraw', args)
  }
}
