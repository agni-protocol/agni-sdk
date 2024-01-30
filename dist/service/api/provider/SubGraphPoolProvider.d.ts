import { Token } from "../../tool";
import { Pool, V2PoolWithTvl, type V3PoolWithTvl } from "../../vo";
import { BaseApi } from "../BaseApi";
import type { GetPoolParams, PoolProvider } from "../../tool/v3route/types";
export declare class SubGraphPoolProvider implements PoolProvider {
    baseApi: BaseApi;
    constructor();
    private getPoolV3MetaData;
    private getPoolV2MetaData;
    private getCandidatePoolsV3OnGraphNode;
    private getCandidatePoolsV2OnGraphNode;
    getCandidatePoolsV3ByToken(tokenA: Token, tokenB: Token): Promise<V3PoolWithTvl[]>;
    getCandidatePoolsV3ByPair(tokenA: Token, tokenB: Token): Promise<V3PoolWithTvl[]>;
    getCandidatePoolsV2ByToken(tokenA: Token, tokenB: Token): Promise<V2PoolWithTvl[]>;
    getCandidatePoolsV2ByPair(tokenA: Token, tokenB: Token): Promise<V2PoolWithTvl[]>;
    getCandidatePools(params: GetPoolParams): Promise<Pool[]>;
}
