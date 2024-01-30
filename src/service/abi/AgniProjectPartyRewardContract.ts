import type { ConnectInfo } from '../../ConnectInfo'
import { AgniProjectPartyReward } from '../../abi'
import { CacheKey } from '../tool'
import { BaseAbi } from './BaseAbi'
import BigNumber from "bignumber.js";

@CacheKey('AgniProjectPartyRewardContract')
export class AgniProjectPartyRewardContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo,address:string) {
    super(connectInfo, address, AgniProjectPartyReward)
  }

  async claim() {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claim', [])
  }
  async setEpoch(epoch: number) {
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'setEpoch', [epoch])
  }
  async setReward(epoch: number, users: string[], amounts: string[]) {
    const value = amounts.map(it=>new BigNumber(it)).reduce((a,b)=>a.plus(b)).toFixed()
    return await this.connectInfo.tx().sendContractTransaction(this.contract, 'setReward', [epoch, users, amounts],{value:value })
  }
}
