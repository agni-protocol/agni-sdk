import { JsonRpcProvider, Network } from 'ethers'
import { ConnectInfo } from '../../ConnectInfo'
import { ApiProvider } from '../api'
import type { StorageProvider } from '../tool'
import { createProxy } from '../tool'
import {MixedRouteQuoterV1Contract} from "../abi/MixedRouteQuoterV1Contract";

/**
 * 地址信息
 */
export class AddressInfo {
  /**
   * chainID
   */
  public chainId: number

  /**
   * 链上区块浏览器地址
   */
  public scan: string

  public rpc: string

  public multicall: string
  public gasMulticall: string


  public initCodeHashAddress: string
  public initCodeHash: string
  public swapRouter: string
  public quoterV2: string
  public mixedRouteQuoterV1: string
  public tickLens: string
  public nftDescriptor: string
  public nonfungibleTokenPositionDescriptor: string
  public nonfungiblePositionManager: string
  public agniPoolDeployer: string
  public WMNT: string
  public USDT: string
  public RUSDY: string
  public USDY: string
  public baseTradeToken: string[]


  public v2Factory: string
  public v2Route: string
  public v2InitCodeHash: string


  public blockGraphApi: string
  public exchangeV3GraphApi: string
  public exchangeV2GraphApi: string
  public projectPartyRewardGraphApi: string

  public launchpadStakeToken: string
  public launchpadStakePool: string
  public launchpadInsurancePool: string
  public launchpadGraphApi: string



  public baseApiUrl: string


  public readonlyConnectInfoInstance: ConnectInfo

  public api: ApiProvider

  public chainName: string

  public storage: StorageProvider

  public getApi(): ApiProvider {
    if (typeof this.api === 'undefined')
      this.api = createProxy(new ApiProvider())

    return this.api
  }

  public readonlyConnectInfo(): ConnectInfo {
    if (typeof this.readonlyConnectInfoInstance === 'undefined') {
      const provider = new JsonRpcProvider(this.rpc, this.chainId, { staticNetwork: new Network(this.chainName, this.chainId), batchMaxCount: 1 })
      const connectInfo = new ConnectInfo()
      connectInfo.provider = provider
      connectInfo.wallet = undefined
      connectInfo.status = true
      connectInfo.addressInfo = this
      connectInfo.writeState = false
      this.readonlyConnectInfoInstance = connectInfo
    }
    return this.readonlyConnectInfoInstance
  }

  getEtherscanAddress(address: string): string {
    return this.getEtherscanLink(address, 'address')
  }

  getEtherscanTx(tx: string): string {
    return this.getEtherscanLink(tx, 'transaction')
  }

  getEtherscanLink(
    data: string,
    type: 'transaction' | 'token' | 'address' | 'block',
  ): string {
    const prefix = this.scan

    switch (type) {
      case 'transaction': {
        return `${prefix}/tx/${data}`
      }
      case 'token': {
        return `${prefix}/token/${data}`
      }
      case 'block': {
        return `${prefix}/block/${data}`
      }
      case 'address':
      default: {
        return `${prefix}/address/${data}`
      }
    }
  }
}
