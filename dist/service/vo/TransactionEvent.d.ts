import type { Provider, TransactionReceipt } from 'ethers';
import type { ConnectInfo } from '../../ConnectInfo';
/**
 * -交易信息
 *
 * 要等待交易上链可以使用   await event.confirm()
 *
 */
export declare class TransactionEvent {
    protected provider: Provider;
    protected connectInfo: ConnectInfo;
    protected _hash: string;
    constructor(connectInfo: ConnectInfo, hash: string);
    /**
     * 获取交易HASH
     */
    hash(): string;
    scan(): string;
    /**
     * 等待交易上链,如果有错误则会直接抛出 BasicException
     */
    confirm(): Promise<TransactionReceipt>;
}
