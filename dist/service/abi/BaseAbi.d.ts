import { Contract, type Fragment, type JsonFragment, type Provider } from 'ethers';
import type { ConnectInfo } from '../../ConnectInfo';
import type { AddressInfo } from '../vo';
import { MulContract } from '../../mulcall';
export declare class BaseAbi {
    protected provider: Provider;
    protected connectInfo: ConnectInfo;
    protected addressInfo: AddressInfo;
    mulContract: MulContract;
    contract: Contract;
    constructor(connectInfo: ConnectInfo, address: string, abi: JsonFragment[] | string[] | Fragment[]);
}
