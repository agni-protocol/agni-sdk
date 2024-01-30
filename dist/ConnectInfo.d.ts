import type { JsonRpcApiProvider, Provider, Signer } from 'ethers';
import { AddressInfo, Erc20Service, MultiCallContract, Newable, TransactionService } from './service';
import type { WalletConnect } from './WalletConnect';
export declare class ConnectInfo {
    private _provider;
    private _wallet;
    private _status;
    private _msg;
    private _account;
    private _chainId;
    walletConnect: WalletConnect;
    private _addressInfo;
    writeState: boolean;
    connectMethod: 'RPC' | 'EXT';
    create<T extends object>(clazz: Newable<T>, ...args: any[]): T;
    clear(): void;
    /**
     * 获取 ERC20 API
     */
    erc20(): Erc20Service;
    /**
     * 获取交易API
     */
    tx(): TransactionService;
    /**
     * multiCall service
     */
    multiCall(): MultiCallContract;
    get provider(): JsonRpcApiProvider;
    set provider(value: JsonRpcApiProvider);
    /**
     * 获取连接的状态
     */
    get status(): boolean;
    set status(value: boolean);
    /**
     * 获取连接的消息
     */
    get msg(): string;
    set msg(value: string);
    /**
     * 获取连接的地址
     */
    get account(): string;
    set account(value: string);
    /**
     * 获取连接的网络ID
     */
    get chainId(): number;
    set chainId(value: number);
    /**
     * 获取连接的地址信息
     */
    get addressInfo(): AddressInfo;
    set addressInfo(value: AddressInfo);
    set wallet(value: Signer);
    getWalletOrProvider(): Signer | Provider;
    getScan(): string;
    addToken(tokenAddress: string): Promise<boolean>;
}
