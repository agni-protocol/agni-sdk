import type { ConnectInfo } from '../../ConnectInfo';
import type { Percent, Token } from '../tool';
import type { Position } from '../tool/sdk/v3';
import type { TransactionEvent } from '../vo';
import { BaseAbi } from './BaseAbi';
export declare class NonfungiblePositionManagerContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    collect(tokenId: string, token0: Token, token1: Token, fee0: string, fee1: string, involvesMNT: boolean): Promise<TransactionEvent>;
    addLiquidity(position: Position, tokenId: string | undefined, createPool: boolean, slippageTolerance: Percent, deadline: number): Promise<TransactionEvent>;
    removeLiquidity(rate: string, token0: Token, token1: Token, partialPosition: Position, tokenId: string, fee0: string, fee1: string, involvesMNT: boolean, slippageTolerance: Percent, deadline: number): Promise<TransactionEvent>;
}
