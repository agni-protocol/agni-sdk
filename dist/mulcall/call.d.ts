import type { Contract } from 'ethers';
import type { ContractCall } from './types';
export declare const MAX_GAS_LIMIT = 30000000;
export declare const QUOTER_TRADE_GAS = 3000000;
export declare const CHUNK_SIZE = 200;
export declare function multicallExecute<T extends any[] = any[]>(multicall: Contract, calls: ContractCall[]): Promise<T>;
