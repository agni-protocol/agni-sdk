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
exports.AgniProjectPartyRewardApi = void 0;
const get_1 = __importDefault(require("lodash/get"));
const abi_1 = require("../abi");
const tool_1 = require("../tool");
const vo_1 = require("../vo");
const BaseApi_1 = require("./BaseApi");
const AgniProjectPartyRewardGql_1 = require("./gql/AgniProjectPartyRewardGql");
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const DashboardGql_1 = require("./gql/DashboardGql");
let AgniProjectPartyRewardApi = class AgniProjectPartyRewardApi {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    projectPartyReward() {
        return this.baseApi.request(`${this.baseApi.address().baseApiUrl}/server_api/project-party-reward`, 'get', {});
    }
    userLPTokenIds(address) {
        return this.baseApi.request(`${this.baseApi.address().baseApiUrl}/server_api/project-party-reward/lp`, 'get', { address });
    }
    async result(account) {
        const partyReward = await this.projectPartyReward();
        const pools = await this.baseApi.exchangeV3Graph(AgniProjectPartyRewardGql_1.AgniProjectPartyQueryPairGQL, { ids: partyReward.pools.map(it => it.poolAddress.toLowerCase()) });
        const poolMap = (0, groupBy_1.default)(pools.result, it => it.id);
        const projectPartyRewardResult = new vo_1.ProjectPartyRewardResult();
        projectPartyRewardResult.currentEpoch = partyReward.currentEpoch;
        projectPartyRewardResult.list = partyReward.pools.map((it) => {
            const poolMapElement = poolMap[it.poolAddress.toLowerCase()];
            if (poolMapElement && poolMapElement.length > 0) {
                return {
                    ...it,
                    feeTier: poolMapElement[0].feeTier,
                    token0Symbol: poolMapElement[0].token0.symbol,
                    token1Symbol: poolMapElement[0].token1.symbol,
                };
            }
            return null;
        }).filter(it => it !== null);
        projectPartyRewardResult.epochTime = partyReward.epochTime;
        projectPartyRewardResult.startTime = partyReward.startTime;
        projectPartyRewardResult.epochCount = partyReward.epochCount;
        const projectPartyRewardMyListResult = new vo_1.ProjectPartyRewardMyListResult();
        projectPartyRewardMyListResult.histories = [];
        projectPartyRewardMyListResult.totalReward = '0';
        projectPartyRewardMyListResult.unClaim = '0';
        projectPartyRewardMyListResult.pools = [];
        projectPartyRewardMyListResult.claim = (connect) => {
            throw new Error('not implement');
        };
        projectPartyRewardResult.my = projectPartyRewardMyListResult;
        function getEpochTime(epoch) {
            return partyReward.startTime + epoch * partyReward.epochTime;
        }
        if (account) {
            const userPools = partyReward.pools.filter(it => (0, tool_1.eqAddress)(it.userAddress, account));
            let dashboardPoolDataResponse = [];
            if (userPools.length > 0) {
                dashboardPoolDataResponse = (await this.baseApi.exchangeV3Graph((0, DashboardGql_1.poolsBulkGQL)(undefined, userPools.map(it => it.poolAddress.toLowerCase())), {})).pools;
            }
            const dashboardPoolDataMap = (0, groupBy_1.default)(dashboardPoolDataResponse, it => it.id);
            const agniProjectPartyReward = this.baseApi.connectInfo().create(abi_1.AgniProjectPartyRewardContract, partyReward.contractAddress);
            const scorePool = (0, groupBy_1.default)(projectPartyRewardResult.list, it => it.poolAddress.toLowerCase());
            const [[{ getReward }], { claimLogs }] = await Promise.all([
                this.baseApi.connectInfo().multiCall()
                    .call({
                    getReward: agniProjectPartyReward.mulContract.getReward(account),
                }),
                this.baseApi.projectPartyRewardGraph(AgniProjectPartyRewardGql_1.AgniProjectPartyClaimLogsGQL, { user: account.toLowerCase() }),
            ]);
            projectPartyRewardMyListResult.pools = userPools.map((it) => {
                const dashboardPoolDataMapElement = dashboardPoolDataMap[it.poolAddress.toLowerCase()] || [];
                const pool = scorePool[it.poolAddress.toLowerCase()];
                if (pool && pool.length > 0) {
                    return {
                        ...pool[0],
                        token0Stake: dashboardPoolDataMapElement.map(it => it.totalValueLockedToken0).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toString()),
                        token1Stake: dashboardPoolDataMapElement.map(it => it.totalValueLockedToken1).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toString()),
                    };
                }
                return null;
            }).filter(it => it !== null);
            projectPartyRewardMyListResult.totalReward = new bignumber_js_1.default(getReward.rewardTotal).div(1e18).toFixed();
            projectPartyRewardMyListResult.unClaim = new bignumber_js_1.default(getReward.availableReward).div(1e18).toFixed();
            projectPartyRewardMyListResult.histories = getReward.infos.map((it) => {
                const hash = (0, get_1.default)(claimLogs.find(claim => claim.epoch === it.epoch), 'hash', '');
                return {
                    claim: it.claim,
                    epoch: it.epoch,
                    amount: new bignumber_js_1.default(it.amount).div(1e18).toFixed(),
                    timestamp: getEpochTime(Number(it.epoch)) / 1000,
                    hash,
                };
            }).filter(it => it.amount !== '0')
                .sort((a, b) => b.timestamp - a.timestamp);
            projectPartyRewardMyListResult.claim = async (connect) => {
                return connect.create(abi_1.AgniProjectPartyRewardContract, partyReward.contractAddress).claim();
            };
        }
        return projectPartyRewardResult;
    }
};
exports.AgniProjectPartyRewardApi = AgniProjectPartyRewardApi;
exports.AgniProjectPartyRewardApi = AgniProjectPartyRewardApi = __decorate([
    (0, tool_1.CacheKey)('AgniProjectPartyRewardApi'),
    __metadata("design:paramtypes", [])
], AgniProjectPartyRewardApi);
