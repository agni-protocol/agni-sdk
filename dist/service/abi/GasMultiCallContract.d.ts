import type { ConnectInfo } from '../../ConnectInfo';
import { BaseAbi } from './BaseAbi';
export interface GasCallRequest {
    target: string;
    callData: string;
    gasLimit: number;
}
export interface GasCallResponse {
    success: boolean;
    returnData: string;
    gasUsed: bigint;
}
export declare class GasMultiCallContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    multicall(callRequests: GasCallRequest[]): Promise<GasCallResponse[]>;
}
