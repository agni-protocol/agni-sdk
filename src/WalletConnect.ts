import {BrowserProvider, type JsonRpcApiProvider, JsonRpcProvider, type Signer, Wallet} from 'ethers'
import get from 'lodash/get'
import {ConnectInfo} from './ConnectInfo'
import {Trace, transactionHistory} from './service'
import {getCurrentAddressInfo} from './Constant'
import {BasicException} from './BasicException'


export class WalletConnect {
  // 钱包链接名称
  wallet: any
  connectInfo: ConnectInfo
  provider: any

  async getChainId(): Promise<number> {
    const web3Provider = this.wallet as BrowserProvider
    return Number.parseInt((await web3Provider.getNetwork()).chainId.toString())
  }

  async getAccount(): Promise<string> {
    const web3Provider = this.wallet as BrowserProvider
    return await (await web3Provider.getSigner()).getAddress();
  }

  async getWallet(): Promise<Signer> {
    const web3Provider = this.wallet as BrowserProvider
    return await web3Provider.getSigner()
  }
  async getApiProvider(): Promise<JsonRpcApiProvider> {
    return this.wallet as BrowserProvider;
  }


  constructor(walletType: any, provider: any = undefined) {
    this.wallet = walletType
    this.provider = provider
  }

  disConnect() {
    const connectInfo = this.connectInfo
    connectInfo.status = false
    connectInfo.msg = 'Check your wallet!'
    this.update()
  }

  update() {
    const connectInfo = this.connectInfo
    connectInfo.walletConnect = this
    if (typeof connectInfo.account === 'undefined' || connectInfo.account === '') {
      connectInfo.status = false
      transactionHistory.initUpdateTransaction(connectInfo, false)
    }
    const currentAddressInfo = getCurrentAddressInfo()
    if (connectInfo.status) {
      connectInfo.account = connectInfo.account.toLowerCase()
      connectInfo.addressInfo = currentAddressInfo
      Trace.debug('connect success ', this.connectInfo.account, this.connectInfo.chainId)
    }
    if (connectInfo.status) {
      connectInfo.clear()
      transactionHistory.initUpdateTransaction(connectInfo, true)
    }
  }



  async init() {
    const connectInfo = this.connectInfo
    connectInfo.chainId = await this.getChainId()
    connectInfo.account = await this.getAccount()
    connectInfo.wallet = await this.getWallet()
    connectInfo.provider = await this.getApiProvider()
    connectInfo.msg = 'success'
    connectInfo.status = true
    this.update()
  }


  static async connectMetaMask(): Promise<WalletConnect> {
    const _ethereum = WalletConnect.getEthereum()
    if (!_ethereum)
      throw new BasicException('Check your wallet!')

    await _ethereum.enable()
    const provider = new BrowserProvider(_ethereum, 'any')
    const walletConnect = new WalletConnect(provider)
    walletConnect.provider = _ethereum
    return walletConnect
  }

  static getEthereum(): any {
    return get(window, 'ethereum')
  }

  /**
   * 链接钱包
   * @returns ConnectInfo
   */
  async connect(): Promise<ConnectInfo> {
    try {
      const connectInfo = new ConnectInfo()
      connectInfo.status = false
      connectInfo.msg = 'Check your wallet!'
      this.connectInfo = connectInfo
      await this.init()
      return this.connectInfo
    } catch (e: any) {
      this.connectInfo.status = false
      this.connectInfo.msg = e.message || e.toString()
      this.update()
      throw e
    }
  }
}

export class ConnectManager {
  private static connectInfo: ConnectInfo
  private static walletConnect: WalletConnect

  public static chainMap: Record<string, any> = {
    rinkeby: '0x4',
    mainnet: '0x1',
  }

  /**
   * 初始化
   * @param wallet
   */
  static async connect(wallet: WalletConnect): Promise<ConnectInfo> {
    ConnectManager.walletConnect = wallet
    ConnectManager.connectInfo = await wallet.connect()
    return ConnectManager.connectInfo
  }

  /**
   * 断开连接
   */
  static async disConnect() {
    if (ConnectManager.walletConnect) {
      ConnectManager.walletConnect.disConnect()
      ConnectManager.walletConnect = undefined
    }
    if (ConnectManager.connectInfo)
      ConnectManager.connectInfo = undefined
  }

  /**
   * 获取连接
   */
  static getConnect() {
    if (ConnectManager.connectInfo) {
      if (ConnectManager.connectInfo.status)
        return ConnectManager.connectInfo
    }
    throw new BasicException('Wallet not connected')
  }

  static addMetamaskChain(chainName: string) {
    const _ethereum = WalletConnect.getEthereum()
    if (!_ethereum)
      return

    const data = ConnectManager.chainMap[chainName]
    if (!data)
      return

    if (typeof data === 'string') {
      _ethereum
        .request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: data,
            },
          ],
        })
        .catch()
      return
    }
    _ethereum.request({method: 'wallet_addEthereumChain', params: data}).catch()
  }
}
