import type {JsonRpcApiProvider, Provider, Signer} from 'ethers'
import {
  AddressInfo,
  clearCache,
  Erc20Service,
  mixProxyByConnect,
  MultiCallContract,
  Newable,
  Trace,
  TransactionService,
} from './service'
import {BasicException} from './BasicException'
import type {WalletConnect} from './WalletConnect'


export class ConnectInfo {
  private _provider: JsonRpcApiProvider
  private _wallet: Signer
  private _status: boolean
  private _msg: string

  private _account: string
  private _chainId: number

  public walletConnect: WalletConnect

  private _addressInfo: AddressInfo

  public writeState: boolean = true

  public connectMethod: 'RPC' | 'EXT' = 'RPC';

  public create<T extends object>(clazz: Newable<T>, ...args: any[]): T {
    return mixProxyByConnect<T>(clazz, this, ...args)
  }

  clear() {
    clearCache()
  }

  /**
   * 获取 ERC20 API
   */
  erc20(): Erc20Service {
    return this.create(Erc20Service)
  }

  /**
   * 获取交易API
   */
  tx(): TransactionService {
    return this.create(TransactionService)
  }

  /**
   * multiCall service
   */
  multiCall(): MultiCallContract {
    return this.create(MultiCallContract)
  }

  get provider(): JsonRpcApiProvider {
    if (this._status)
      return this._provider as JsonRpcApiProvider

    throw new BasicException('Wallet not connected!')
  }

  set provider(value: JsonRpcApiProvider) {
    this._provider = value
  }

  /**
   * 获取连接的状态
   */
  get status(): boolean {
    return this._status as boolean
  }

  set status(value: boolean) {
    this._status = value
  }

  /**
   * 获取连接的消息
   */
  get msg(): string {
    return this._msg as string
  }

  set msg(value: string) {
    this._msg = value
  }

  /**
   * 获取连接的地址
   */
  get account(): string {
    return this._account as string
  }

  set account(value: string) {
    this._account = value
  }

  /**
   * 获取连接的网络ID
   */
  get chainId(): number {
    return this._chainId as number
  }

  set chainId(value: number) {
    this._chainId = value
  }

  /**
   * 获取连接的地址信息
   */
  get addressInfo(): AddressInfo {
    return this._addressInfo as AddressInfo
  }

  set addressInfo(value: AddressInfo) {
    this._addressInfo = value
  }

  // eslint-disable-next-line accessor-pairs
  set wallet(value: Signer) {
    this._wallet = value
  }

  getWalletOrProvider(): Signer | Provider {
    return (this._wallet || this._provider) as Signer | Provider
  }

  getScan(): string {
    return this.addressInfo.scan as string
  }

  async addToken(tokenAddress: string): Promise<boolean> {
    const token = await this.erc20().getTokenInfo(tokenAddress)
    Trace.debug('token info', token)
    try {
      const wasAdded = await this.provider.send('wallet_watchAsset', {
        type: 'ERC20',
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimal,
        },
      } as any)
      if (wasAdded)
        return true
    } catch (error) {
      Trace.error(error)
    }
    return false
  }
}
