import { ChainId } from '../../sdk';
export declare const COST_PER_UNINIT_TICK = 0n;
export declare function BASE_SWAP_COST_V3(id: ChainId): bigint;
export declare function COST_PER_INIT_TICK(id: ChainId): bigint;
export declare function COST_PER_HOP_V3(id: ChainId): bigint;
export declare const BASE_SWAP_COST_V2 = 135000n;
export declare const COST_PER_EXTRA_HOP_V2 = 50000n;
export * from './poolSelector';
export * from './routeConfig';
