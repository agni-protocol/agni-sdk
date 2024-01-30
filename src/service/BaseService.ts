import type { Provider } from 'ethers'
import type { ConnectInfo } from '../ConnectInfo'
import type { AddressInfo } from './vo'

export class BaseService {
  protected provider: Provider
  protected connectInfo: ConnectInfo
  protected addressInfo: AddressInfo

  constructor(connectInfo: ConnectInfo) {
    this.provider = connectInfo.provider
    this.connectInfo = connectInfo
    this.addressInfo = connectInfo.addressInfo
  }
}
