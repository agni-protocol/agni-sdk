import {ethers, JsonRpcApiProvider, JsonRpcApiProviderOptions, JsonRpcProvider, Network, Signer, Wallet} from 'ethers'
import {ConnectInfo, getCurrentAddressInfo, initAddress, Trace, TransactionEvent, WalletConnect} from '../src'
import {ExtTransactionEvent} from "../src/service/vo/ExtTransactionEvent";

initAddress('dev')

class DebugRpcProvider extends JsonRpcProvider {
  async send(method: string, params: Array<any> | Record<string, any>): Promise<any> {
     const result = await super.send(method, params);
     return result
  }
}


export async function connect(): Promise<ConnectInfo> {
  const privateKey: string = '// private key'
  const currentAddressInfo = getCurrentAddressInfo()
  const rpcUrl = currentAddressInfo.rpc
  const config: JsonRpcApiProviderOptions = {
    staticNetwork: new Network(currentAddressInfo.chainName, currentAddressInfo.chainId),
    batchMaxCount: 1,
    batchMaxSize: 1
  }
  const provider = new DebugRpcProvider(rpcUrl, currentAddressInfo.chainId, config)
  const wallet = new ethers.Wallet(privateKey, provider)

  class PrivateWallet extends WalletConnect {

    wallet: Wallet
    provider: JsonRpcProvider

    constructor(wallet: Wallet, apiProvider: JsonRpcProvider) {
      super(wallet, apiProvider);
      this.wallet = wallet;
      this.provider = apiProvider;
    }

    async getChainId(): Promise<number> {
      return  Number.parseInt((await this.provider.getNetwork()).chainId.toString())
    }

    async getWallet(): Promise<Signer> {
      return this.wallet
    }

    async getApiProvider(): Promise<JsonRpcApiProvider> {
      return this.provider
    }

    async getAccount(): Promise<string> {
      return  this.wallet.address
    }
  }


  return await (new PrivateWallet(wallet,provider).connect());


  // return await (await WalletConnect.connectMetaMask()).connect()
}




export async function handTx(transactionEvent:TransactionEvent){

  if (transactionEvent instanceof ExtTransactionEvent){

    const data = transactionEvent.data;
    const {
      gasPrice,
      gasLimit,
      value,
      from,
      to
    } = transactionEvent.config;



    Trace.log(
      "data",data,
      "gasPrice",gasPrice,
      "gasLimit",gasLimit,
      "value",value,
      "from",from
    )

    // signature
    // Broadcast on-chain ...

    //  const connectInfo = await connect();
    //  const transactionResponse = await connectInfo.getWalletOrProvider().sendTransaction({
    //    data,
    //    gasPrice,
    //    gasLimit,
    //    value,
    //    to,
    //    from
    //  });
    // console.log(transactionResponse)

  }else {
    Trace.log(transactionEvent.scan())
    Trace.log(await transactionEvent.confirm())
  }

}
