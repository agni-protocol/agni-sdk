import { type JsonRpcApiProvider, type Signer } from 'ethers';
import { ConnectInfo } from './ConnectInfo';
export declare class WalletConnect {
    wallet: any;
    connectInfo: ConnectInfo;
    provider: any;
    getChainId(): Promise<number>;
    getAccount(): Promise<string>;
    getWallet(): Promise<Signer>;
    getApiProvider(): Promise<JsonRpcApiProvider>;
    constructor(walletType: any, provider?: any);
    disConnect(): void;
    update(): void;
    init(): Promise<void>;
    static connectMetaMask(): Promise<WalletConnect>;
    static getEthereum(): any;
    /**
     * 链接钱包
     * @returns ConnectInfo
     */
    connect(): Promise<ConnectInfo>;
}
export declare class ConnectManager {
    private static connectInfo;
    private static walletConnect;
    static chainMap: Record<string, any>;
    /**
     * 初始化
     * @param wallet
     */
    static connect(wallet: WalletConnect): Promise<ConnectInfo>;
    /**
     * 断开连接
     */
    static disConnect(): Promise<void>;
    /**
     * 获取连接
     */
    static getConnect(): ConnectInfo;
    static addMetamaskChain(chainName: string): void;
}
