import {CacheKey, CurrencyAmount, isNullOrUndefined, Token} from "../../tool";
import {FeeAmount, Pool, PoolType, V2PoolWithTvl, type V3PoolWithTvl} from "../../vo";
import {PoolV3Api} from "../PoolV3Api";
import {Pair} from "../../tool/sdk/v2";
import groupBy from "lodash/groupBy";
import {SwapQueryV3Pools, SwapQueryV3PoolsResult} from "../gql/SwapV3Gql";
import {parseProtocolFees} from "../../tool/sdk/v3/utils";
import {v2PoolTvlSelector, v3PoolTvlSelector} from "../../tool/v3route/constants";
import {SwapV2QueryV2PoolsGQL, SwapV2QueryV2PoolsGQLType} from "../gql/SwapV2Gql";
import BigNumber from "bignumber.js";
import {getPairCombinations} from "../../tool/math/SwapV3Math";
import {BASE_API, BaseApi} from "../BaseApi";
import type {GetPoolParams, PoolProvider} from "../../tool/v3route/types";

interface PoolV3MetaData {
  address: string
  token0: Token
  token1: Token
  fee: FeeAmount
}

interface PoolV2MetaData {
  address: string
  token0: Token
  token1: Token
}

@CacheKey('SubGraphPoolProvider')
export class SubGraphPoolProvider implements PoolProvider{

  public baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  private getPoolV3MetaData(tokenA: Token, tokenB: Token): PoolV3MetaData[] {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    return [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH]
      .map((it) => {
        const address = PoolV3Api.computePoolAddress(token0, token1, it)
        return {
          address,
          token0: token0.wrapped,
          token1: token1.wrapped,
          fee: it,
        }
      })
  }

  private getPoolV2MetaData(tokenA: Token, tokenB: Token): PoolV2MetaData {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    const address = Pair.getAddress(token0, token1)
    return {
      address,
      token0: token0.wrapped,
      token1: token1.wrapped,
    }
  }

  private async getCandidatePoolsV3OnGraphNode(tokenA: Token, tokenB: Token, mataData: PoolV3MetaData[]): Promise<V3PoolWithTvl[]> {
    const metaDataGroup = groupBy(mataData, it => it.address.toLowerCase())
    const swapQueryV3PoolsResult = await this.baseApi.exchangeV3Graph<SwapQueryV3PoolsResult>(SwapQueryV3Pools, {
      pageSize: 1000,
      poolAddrs: mataData.map(it => it.address.toLowerCase()),
    })
    const pools = swapQueryV3PoolsResult.pools.map((it) => {
      const metaDataGroupElement = metaDataGroup[it.id]
      if (!metaDataGroupElement && metaDataGroupElement.length === 0)
        return undefined

      const metaData = metaDataGroupElement[0]

      const {fee, token0, token1, address} = metaData
      const [token0ProtocolFee, token1ProtocolFee] = parseProtocolFees(it.feeProtocol)
      return {
        type: PoolType.V3 as const,
        fee,
        token0,
        token1,
        liquidity: BigInt(it.liquidity),
        sqrtRatioX96: BigInt(it.sqrtPrice),
        tick: Number(it.tick),
        address,
        tvlUSD: BigInt(Number.parseInt(it.totalValueLockedUSD)),
        token0ProtocolFee,
        token1ProtocolFee,
        ticks: undefined,
      } as V3PoolWithTvl
    }).filter(it => !isNullOrUndefined(it))
    return v3PoolTvlSelector(tokenA, tokenB, pools) as V3PoolWithTvl[]
  }

  private async getCandidatePoolsV2OnGraphNode(tokenA: Token, tokenB: Token, mataData: PoolV2MetaData[]): Promise<V2PoolWithTvl[]> {
    const metaDataGroup = groupBy(mataData, it => it.address.toLowerCase())
    const swapQueryV3PoolsResult = await this.baseApi.exchangeV2Graph<SwapV2QueryV2PoolsGQLType>(SwapV2QueryV2PoolsGQL, {
      pageSize: 1000,
      poolAddrs: mataData.map(it => it.address.toLowerCase()),
    })
    const pools = swapQueryV3PoolsResult.pairs.map((it) => {
      const metaDataGroupElement = metaDataGroup[it.id]
      if (!metaDataGroupElement && metaDataGroupElement.length === 0)
        return undefined
      const metaData = metaDataGroupElement[0]
      const {token0, token1, address} = metaData
      if (!it.reserve0 || !it.reserve1) {
        return null
      }
      return {
        address,
        token0,
        token1,
        type: PoolType.V2 as const,
        reserve0: CurrencyAmount.fromRawAmount(token0, new BigNumber(it.reserve0).multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN)),
        reserve1: CurrencyAmount.fromRawAmount(token1, new BigNumber(it.reserve1).multipliedBy(10 ** token1.decimals).toFixed(0, BigNumber.ROUND_DOWN)),
        tvlUSD: BigInt(Number.parseInt(it.reserveUSD)),
      } as V2PoolWithTvl
    }).filter(it => !isNullOrUndefined(it))
    return v2PoolTvlSelector(tokenA, tokenB, pools) as V2PoolWithTvl[]
  }

  public async getCandidatePoolsV3ByToken(tokenA: Token, tokenB: Token): Promise<V3PoolWithTvl[]> {
    const poolMetaData = getPairCombinations(tokenA, tokenB).flatMap(it => this.getPoolV3MetaData(it[0], it[1]))
    return this.getCandidatePoolsV3OnGraphNode(tokenA, tokenB, poolMetaData)
  }

  public async getCandidatePoolsV3ByPair(tokenA: Token, tokenB: Token): Promise<V3PoolWithTvl[]> {
    const poolMetaData = this.getPoolV3MetaData(tokenA, tokenB)
    return this.getCandidatePoolsV3OnGraphNode(tokenA, tokenB, poolMetaData)
  }

  public async getCandidatePoolsV2ByToken(tokenA: Token, tokenB: Token): Promise<V2PoolWithTvl[]> {
    const poolMetaDatas = getPairCombinations(tokenA, tokenB).flatMap(it => this.getPoolV2MetaData(it[0], it[1]))
    return this.getCandidatePoolsV2OnGraphNode(tokenA, tokenB, poolMetaDatas)
  }

  public async getCandidatePoolsV2ByPair(tokenA: Token, tokenB: Token): Promise<V2PoolWithTvl[]> {
    const poolMetaData = this.getPoolV2MetaData(tokenA, tokenB)
    return this.getCandidatePoolsV2OnGraphNode(tokenA, tokenB, [poolMetaData])
  }

  async getCandidatePools(params: GetPoolParams): Promise<Pool[]> {
    const currencyA = params.currencyA.wrapped;
    const currencyB = params.currencyB.wrapped;
    const protocols = params.protocols;
    const pools = await Promise.all(protocols.map(it=>{
      return it == PoolType.V2 ? this.getCandidatePoolsV2ByToken(currencyA, currencyB) : this.getCandidatePoolsV3ByToken(currencyA, currencyB)
    }));
    return pools.flatMap((it) => it as Pool[])
  }
}
