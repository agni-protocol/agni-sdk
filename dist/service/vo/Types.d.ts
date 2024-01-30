import type { ConnectInfo } from '../../ConnectInfo';
import type { Token } from '../tool/sdk';
import type { TransactionEvent } from './TransactionEvent';
export declare const ETH_ADDRESS = "MNT";
export declare const DEFAULT_ICON: string;
export type RecentTransactionType = 'add' | 'remove' | 'collect_fee' | 'swap';
export type RecentTransactionStatus = 'success' | 'fail' | 'pending';
export interface SaveRecentTransaction {
    token0: Token;
    token1: Token;
    token0Amount: string;
    token1Amount: string;
    type: RecentTransactionType;
    to: string | undefined;
}
export interface StorageRecentTransaction {
    index: number;
    txHash: string;
    chainId: number;
    token0: Token;
    token1: Token;
    token0Amount: string;
    token1Amount: string;
    type: RecentTransactionType;
    time: number;
    to: string;
    status: RecentTransactionStatus;
}
export interface RecentTransactions extends StorageRecentTransaction {
    chainName: string;
    title: string;
    hashUrl: string;
}
export declare class Balance {
    token: Token;
    user: string;
    balance: string;
    constructor(token: Token, user: string, balance: string);
    select(rate: '25' | '50' | '75' | 'max'): string;
}
export declare class BalanceAndAllowance extends Balance {
    allowance: string;
    spender: string;
    constructor(token: Token, user: string, balance: string, allowance: string, spender: string);
    showApprove(inputAmount: string): boolean;
    approve(connectInfo: ConnectInfo): Promise<TransactionEvent>;
    static unavailable(token: Token): BalanceAndAllowance;
}
