import get from 'lodash/get'
import {AgniProjectPartyRewardContract} from '../abi'
import {CacheKey, eqAddress} from '../tool'
import type {ProjectPartyReward, ProjectPartyRewardInfo, ProjectPartyUserLp} from '../vo'
import {
  DashboardPoolDataResponse,
  DashboardPoolFields,
  ProjectPartyRewardMyListResult,
  ProjectPartyRewardPool,
  ProjectPartyRewardResult,
  ProjectPartyRewardUserPool
} from '../vo'
import type {BaseApi} from './BaseApi'
import {BASE_API} from './BaseApi'
import {
  AgniProjectPartyClaimLogsGQL,
  AgniProjectPartyClaimLogsGQLResult,
  AgniProjectPartyQueryPairGQL,
  AgniProjectPartyQueryPairGQLResult
} from "./gql/AgniProjectPartyRewardGql";
import groupBy from "lodash/groupBy";
import BigNumber from "bignumber.js";
import {poolsBulkGQL} from "./gql/DashboardGql";

@CacheKey('AgniProjectPartyRewardApi')
export class AgniProjectPartyRewardApi {
  public baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  private projectPartyReward(): Promise<ProjectPartyReward> {
    return this.baseApi.request(`${this.baseApi.address().baseApiUrl}/server_api/project-party-reward`, 'get', {})
  }

  private userLPTokenIds(address: string): Promise<ProjectPartyUserLp[]> {
    return this.baseApi.request(`${this.baseApi.address().baseApiUrl}/server_api/project-party-reward/lp`, 'get', {address})
  }

  async result(account: string): Promise<ProjectPartyRewardResult> {
    const partyReward = await this.projectPartyReward()
    const pools = await this.baseApi.exchangeV3Graph<AgniProjectPartyQueryPairGQLResult>(AgniProjectPartyQueryPairGQL, {ids: partyReward.pools.map(it => it.poolAddress.toLowerCase())});
    const poolMap = groupBy(pools.result, it => it.id);
    const projectPartyRewardResult = new ProjectPartyRewardResult()
    projectPartyRewardResult.currentEpoch = partyReward.currentEpoch
    projectPartyRewardResult.list = partyReward.pools.map((it) => {
      const poolMapElement = poolMap[it.poolAddress.toLowerCase()];
      if (poolMapElement && poolMapElement.length > 0) {
        return {
          ...it,
          feeTier: poolMapElement[0].feeTier,
          token0Symbol: poolMapElement[0].token0.symbol,
          token1Symbol: poolMapElement[0].token1.symbol,
        } as ProjectPartyRewardPool
      }
      return null;
    }).filter(it => it !== null)

    projectPartyRewardResult.epochTime = partyReward.epochTime
    projectPartyRewardResult.startTime = partyReward.startTime
    projectPartyRewardResult.epochCount = partyReward.epochCount

    const projectPartyRewardMyListResult = new ProjectPartyRewardMyListResult()
    projectPartyRewardMyListResult.histories = []
    projectPartyRewardMyListResult.totalReward = '0'
    projectPartyRewardMyListResult.unClaim = '0'
    projectPartyRewardMyListResult.pools = []
    projectPartyRewardMyListResult.claim = (connect) => {
      throw new Error('not implement')
    }

    projectPartyRewardResult.my = projectPartyRewardMyListResult

    function getEpochTime(epoch: number) {
      return partyReward.startTime + epoch * partyReward.epochTime
    }

    if (account) {

      const userPools = partyReward.pools.filter(it => eqAddress(it.userAddress, account));
      let dashboardPoolDataResponse: DashboardPoolFields[] = []
      if (userPools.length > 0) {
        dashboardPoolDataResponse = (
          await this.baseApi.exchangeV3Graph<DashboardPoolDataResponse>(poolsBulkGQL(undefined, userPools.map(it => it.poolAddress.toLowerCase())), {})
        ).pools
      }
      const dashboardPoolDataMap = groupBy(dashboardPoolDataResponse, it => it.id);

      const agniProjectPartyReward = this.baseApi.connectInfo().create(AgniProjectPartyRewardContract, partyReward.contractAddress)
      const scorePool = groupBy(projectPartyRewardResult.list, it => it.poolAddress.toLowerCase());

      const [[{getReward}], {claimLogs}] = await Promise.all([
        this.baseApi.connectInfo().multiCall()
          .call<[{ getReward: ProjectPartyRewardInfo }]>({
            getReward: agniProjectPartyReward.mulContract.getReward(account),
          }),
        this.baseApi.projectPartyRewardGraph<AgniProjectPartyClaimLogsGQLResult>(AgniProjectPartyClaimLogsGQL, {user: account.toLowerCase()}),

      ]);
      projectPartyRewardMyListResult.pools = userPools.map((it) => {
        const dashboardPoolDataMapElement = dashboardPoolDataMap[it.poolAddress.toLowerCase()] || [];
        const pool = scorePool[it.poolAddress.toLowerCase()];
        if (pool && pool.length > 0) {
          return {
            ...pool[0],
            token0Stake: dashboardPoolDataMapElement.map(it => it.totalValueLockedToken0).reduce((a, b) => new BigNumber(a).plus(b).toString()),
            token1Stake: dashboardPoolDataMapElement.map(it => it.totalValueLockedToken1).reduce((a, b) => new BigNumber(a).plus(b).toString()),
          } as ProjectPartyRewardUserPool
        }
        return null;
      }).filter(it => it !== null)
      projectPartyRewardMyListResult.totalReward = new BigNumber(getReward.rewardTotal).div(1e18).toFixed()
      projectPartyRewardMyListResult.unClaim = new BigNumber(getReward.availableReward).div(1e18).toFixed()
      projectPartyRewardMyListResult.histories = getReward.infos.map((it) => {
        const hash = get(claimLogs.find(claim => claim.epoch === it.epoch), 'hash', '')
        return {
          claim: it.claim,
          epoch: it.epoch,
          amount: new BigNumber(it.amount).div(1e18).toFixed(),
          timestamp: getEpochTime(Number(it.epoch)) / 1000,
          hash,
        }
      }).filter(it => it.amount !== '0')
        .sort((a, b) => b.timestamp - a.timestamp)
      projectPartyRewardMyListResult.claim = async (connect) => {
        return connect.create(AgniProjectPartyRewardContract, partyReward.contractAddress).claim()
      }
    }
    return projectPartyRewardResult
  }
}
