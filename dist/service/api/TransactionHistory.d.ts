import type { ConnectInfo } from '../../ConnectInfo';
import type { RecentTransactions, SaveRecentTransaction, TransactionEvent } from '../vo';
export declare class TransactionHistory {
    static connect: ConnectInfo;
    static start: boolean;
    static timoutId: any;
    private baseApi;
    constructor();
    private getKey;
    initUpdateTransaction(connectInfo: ConnectInfo, start: boolean): void;
    private startUpdateTransaction;
    private updateTransaction;
    saveHistory(connectInfo: ConnectInfo, event: TransactionEvent, saveData: SaveRecentTransaction): void;
    histories(connectInfo: ConnectInfo): RecentTransactions[];
    removeByTxHash(connectInfo: ConnectInfo, txHash: string): void;
    removeByIndex(connectInfo: ConnectInfo, index: number): void;
    private update;
    removeAll(connectInfo: ConnectInfo): void;
    private storageHistories;
}
declare const transactionHistory: TransactionHistory;
export { transactionHistory, };
