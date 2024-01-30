import type { ConnectInfo } from '../../ConnectInfo';
import type { ContractCall } from '../../mulcall';
import { BaseAbi } from './BaseAbi';
export type ShapeWithLabel = Record<string, ContractCall | string>;
export declare class MultiCallContract extends BaseAbi {
    constructor(connectInfo: ConnectInfo);
    singleCall<T = any>(shapeWithLabel: ShapeWithLabel): Promise<T>;
    call<T = any[]>(...shapeWithLabels: ShapeWithLabel[]): Promise<T>;
}
