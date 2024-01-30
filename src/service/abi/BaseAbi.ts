import { Contract, type Fragment, type JsonFragment, type Provider } from 'ethers'
import type { ConnectInfo } from '../../ConnectInfo'
import type { AddressInfo } from '../vo'
import { MulContract } from '../../mulcall'

export class BaseAbi {
  protected provider: Provider
  protected connectInfo: ConnectInfo
  protected addressInfo: AddressInfo

  public mulContract: MulContract
  public contract: Contract

  constructor(connectInfo: ConnectInfo, address: string, abi: JsonFragment[] | string[] | Fragment[]) {
    this.provider = connectInfo.provider
    this.connectInfo = connectInfo
    this.addressInfo = connectInfo.addressInfo

    this.mulContract = new MulContract(address, abi)
    this.contract = new Contract(address, abi, connectInfo.getWalletOrProvider())
  }
}
