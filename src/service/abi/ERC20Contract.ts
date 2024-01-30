import type { ConnectInfo } from '../../ConnectInfo'
import { IERC20 } from '../../abi'
import type { TransactionEvent } from '../vo'
import { CacheKey } from '../tool'
import { BaseAbi } from './BaseAbi'

@CacheKey('ERC20Contract')
export class ERC20Contract extends BaseAbi {
  constructor(connectInfo: ConnectInfo, token: string) {
    super(connectInfo, token, IERC20)
  }

  async allowance(owner: string, sender: string): Promise<string> {
    return (await this.contract.allowance(owner, sender)).toString()
  }

  async approve(spender: string, value: string): Promise<TransactionEvent> {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'approve', [spender, value], {})
  }

  async transfer(to: string, value: string): Promise<TransactionEvent> {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'transfer', [to, value], {})
  }

  async transferFrom(from: string, to: string, value: string): Promise<TransactionEvent> {
    return await this.connectInfo
      .tx()
      .sendContractTransaction(this.contract, 'transferFrom', [from, to, value], {})
  }

  async totalSupply(): Promise<string> {
    return (await this.contract.totalSupply()).toString()
  }

  async balanceOf(owner: string): Promise<string> {
    return (await this.contract.balanceOf(owner)).toString()
  }

  async name(): Promise<string> {
    return (await this.contract.name()).toString()
  }

  async symbol(): Promise<string> {
    return (await this.contract.symbol()).toString()
  }

  async decimals(): Promise<number> {
    return Number.parseInt((await this.contract.decimals()).toString(), 10)
  }
}
