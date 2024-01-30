import type { Variables } from 'graphql-request';
import type { ConnectInfo } from '../../ConnectInfo';
import type { AddressInfo } from '../vo';
export declare class BaseApi {
    request<T = any>(path: string, method: 'get' | 'post' | 'put' | 'delete', data: any, config?: any): Promise<T>;
    graphBase<T = any, V = Variables>(fullUrl: string, query: string, variables: V): Promise<T>;
    blockGraph<T = any, V = Variables>(query: string, variables: V): Promise<T>;
    projectPartyRewardGraph<T = any, V = Variables>(query: string, variables: V): Promise<T>;
    exchangeV3Graph<T = any, V = Variables>(query: string, variables: V): Promise<T>;
    exchangeV2Graph<T = any, V = Variables>(query: string, variables: V): Promise<T>;
    launchpadGraph<T = any, V = Variables>(query: string, variables: V): Promise<T>;
    connectInfo(): ConnectInfo;
    address(): AddressInfo;
}
export declare const BASE_API: BaseApi;
