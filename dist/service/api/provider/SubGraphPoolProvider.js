"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubGraphPoolProvider = void 0;
const tool_1 = require("../../tool");
const vo_1 = require("../../vo");
const PoolV3Api_1 = require("../PoolV3Api");
const v2_1 = require("../../tool/sdk/v2");
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const SwapV3Gql_1 = require("../gql/SwapV3Gql");
const utils_1 = require("../../tool/sdk/v3/utils");
const constants_1 = require("../../tool/v3route/constants");
const SwapV2Gql_1 = require("../gql/SwapV2Gql");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const SwapV3Math_1 = require("../../tool/math/SwapV3Math");
const BaseApi_1 = require("../BaseApi");
let SubGraphPoolProvider = class SubGraphPoolProvider {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    getPoolV3MetaData(tokenA, tokenB) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
        return [vo_1.FeeAmount.LOWEST, vo_1.FeeAmount.LOW, vo_1.FeeAmount.MEDIUM, vo_1.FeeAmount.HIGH]
            .map((it) => {
            const address = PoolV3Api_1.PoolV3Api.computePoolAddress(token0, token1, it);
            return {
                address,
                token0: token0.wrapped,
                token1: token1.wrapped,
                fee: it,
            };
        });
    }
    getPoolV2MetaData(tokenA, tokenB) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
        const address = v2_1.Pair.getAddress(token0, token1);
        return {
            address,
            token0: token0.wrapped,
            token1: token1.wrapped,
        };
    }
    async getCandidatePoolsV3OnGraphNode(tokenA, tokenB, mataData) {
        const metaDataGroup = (0, groupBy_1.default)(mataData, it => it.address.toLowerCase());
        const swapQueryV3PoolsResult = await this.baseApi.exchangeV3Graph(SwapV3Gql_1.SwapQueryV3Pools, {
            pageSize: 1000,
            poolAddrs: mataData.map(it => it.address.toLowerCase()),
        });
        const pools = swapQueryV3PoolsResult.pools.map((it) => {
            const metaDataGroupElement = metaDataGroup[it.id];
            if (!metaDataGroupElement && metaDataGroupElement.length === 0)
                return undefined;
            const metaData = metaDataGroupElement[0];
            const { fee, token0, token1, address } = metaData;
            const [token0ProtocolFee, token1ProtocolFee] = (0, utils_1.parseProtocolFees)(it.feeProtocol);
            return {
                type: vo_1.PoolType.V3,
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
            };
        }).filter(it => !(0, tool_1.isNullOrUndefined)(it));
        return (0, constants_1.v3PoolTvlSelector)(tokenA, tokenB, pools);
    }
    async getCandidatePoolsV2OnGraphNode(tokenA, tokenB, mataData) {
        const metaDataGroup = (0, groupBy_1.default)(mataData, it => it.address.toLowerCase());
        const swapQueryV3PoolsResult = await this.baseApi.exchangeV2Graph(SwapV2Gql_1.SwapV2QueryV2PoolsGQL, {
            pageSize: 1000,
            poolAddrs: mataData.map(it => it.address.toLowerCase()),
        });
        const pools = swapQueryV3PoolsResult.pairs.map((it) => {
            const metaDataGroupElement = metaDataGroup[it.id];
            if (!metaDataGroupElement && metaDataGroupElement.length === 0)
                return undefined;
            const metaData = metaDataGroupElement[0];
            const { token0, token1, address } = metaData;
            if (!it.reserve0 || !it.reserve1) {
                return null;
            }
            return {
                address,
                token0,
                token1,
                type: vo_1.PoolType.V2,
                reserve0: tool_1.CurrencyAmount.fromRawAmount(token0, new bignumber_js_1.default(it.reserve0).multipliedBy(10 ** token0.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN)),
                reserve1: tool_1.CurrencyAmount.fromRawAmount(token1, new bignumber_js_1.default(it.reserve1).multipliedBy(10 ** token1.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN)),
                tvlUSD: BigInt(Number.parseInt(it.reserveUSD)),
            };
        }).filter(it => !(0, tool_1.isNullOrUndefined)(it));
        return (0, constants_1.v2PoolTvlSelector)(tokenA, tokenB, pools);
    }
    async getCandidatePoolsV3ByToken(tokenA, tokenB) {
        const poolMetaData = (0, SwapV3Math_1.getPairCombinations)(tokenA, tokenB).flatMap(it => this.getPoolV3MetaData(it[0], it[1]));
        return this.getCandidatePoolsV3OnGraphNode(tokenA, tokenB, poolMetaData);
    }
    async getCandidatePoolsV3ByPair(tokenA, tokenB) {
        const poolMetaData = this.getPoolV3MetaData(tokenA, tokenB);
        return this.getCandidatePoolsV3OnGraphNode(tokenA, tokenB, poolMetaData);
    }
    async getCandidatePoolsV2ByToken(tokenA, tokenB) {
        const poolMetaDatas = (0, SwapV3Math_1.getPairCombinations)(tokenA, tokenB).flatMap(it => this.getPoolV2MetaData(it[0], it[1]));
        return this.getCandidatePoolsV2OnGraphNode(tokenA, tokenB, poolMetaDatas);
    }
    async getCandidatePoolsV2ByPair(tokenA, tokenB) {
        const poolMetaData = this.getPoolV2MetaData(tokenA, tokenB);
        return this.getCandidatePoolsV2OnGraphNode(tokenA, tokenB, [poolMetaData]);
    }
    async getCandidatePools(params) {
        const currencyA = params.currencyA.wrapped;
        const currencyB = params.currencyB.wrapped;
        const protocols = params.protocols;
        const pools = await Promise.all(protocols.map(it => {
            return it == vo_1.PoolType.V2 ? this.getCandidatePoolsV2ByToken(currencyA, currencyB) : this.getCandidatePoolsV3ByToken(currencyA, currencyB);
        }));
        return pools.flatMap((it) => it);
    }
};
exports.SubGraphPoolProvider = SubGraphPoolProvider;
exports.SubGraphPoolProvider = SubGraphPoolProvider = __decorate([
    (0, tool_1.CacheKey)('SubGraphPoolProvider'),
    __metadata("design:paramtypes", [])
], SubGraphPoolProvider);
