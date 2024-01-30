import BigNumber from 'bignumber.js'
import get from 'lodash/get'
import {
  ETH_ADDRESS,
  IDODepositInfo,
  IDOPool,
  IDOPoolDetail,
  IDOPoolInfo,
  IdoPoolInfos,
  IdoPoolStatistic,
  IDOToken,
  IDOUserDepositInfo,
  LaunchpadInfo,
  LaunchpadStakeDetail,
  LaunchpadStakeInfo,
} from '../vo'
import {ERC20Contract, IdoPoolContract, InsurancePoolContract, StakingPoolContract} from '../abi'
import {BasicException} from '../../BasicException'
import {CacheKey, INVALID_ADDRESS, isNumber, Trace} from '../tool'

import type {ConnectInfo} from '../../ConnectInfo'
import {
  QueryIDOPoolInfo,
  QueryIdoPoolInfosGQL,
  QueryIDOUserDepositedLogsByPool,
  QueryTokenATHPriceHistory,
  UserStakeInfosGQL,
} from './gql/LaunchpadGql'
import type {BaseApi} from './BaseApi'
import {BASE_API} from './BaseApi'

const PriceCache = new Map<string, {
  time: number
  price: {
    ath: string
    last: string
  }
}>()
const TokenLogoCache = new Map<string, string>()

@CacheKey('LaunchpadApi')
export class LaunchpadApi {
  public baseApi: BaseApi = BASE_API

  private async getUserStakeInfoByGql(user: string, token: string): Promise<LaunchpadStakeInfo[]> {
    const res = await this.baseApi.launchpadGraph<{
      stakeInfos: LaunchpadStakeInfo[]
    }>(
      UserStakeInfosGQL,
      {
        user: user.toLowerCase(),
        token: token.toLowerCase(),
      },
    )
    return res.stakeInfos
  }

  async staking(account: string = ''): Promise<LaunchpadStakeDetail> {
    const userAddress = account || INVALID_ADDRESS
    const tokenAddress = this.baseApi.address().launchpadStakeToken
    const launchpadStakePoolAddress = this.baseApi.address().launchpadStakePool
    const stakingPoolAbi = this.baseApi.connectInfo().create(StakingPoolContract)
    const [
      stakeInfos,
      batchGetTokens,
      {
        getScoreByTier,
        getUserScore,
        getUserTier,
      },
    ] = await Promise.all([
      this.getUserStakeInfoByGql(userAddress, tokenAddress),
      this.baseApi.address().getApi().tokenMangerApi().batchGetTokens([ETH_ADDRESS]),
      this.baseApi.connectInfo().multiCall()
        .singleCall<{ getScoreByTier: string; getUserScore: string, getUserTier: string }>(
          {
            getScoreByTier: stakingPoolAbi.mulContract.getScoreByTier('1'),
            getUserScore: stakingPoolAbi.mulContract.getUserScore(userAddress),
            getUserTier: stakingPoolAbi.mulContract.getUserTier(userAddress),
          },
        ),
    ])
    const stakeTokenInfo = batchGetTokens[ETH_ADDRESS]
    const {[stakeTokenInfo.address]: balanceAndAllowances} = await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(
      userAddress,
      launchpadStakePoolAddress,
      [stakeTokenInfo],
    )

    const unixDate = new Date().getTime() / 1000
    const stakeDetail = new LaunchpadStakeDetail()
    stakeDetail.token = stakeTokenInfo
    stakeDetail.balance = balanceAndAllowances
    stakeDetail.minInputAmount = BigNumber.max(new BigNumber(getScoreByTier).minus(getUserScore).dividedBy(1e8), new BigNumber(1).div(1e8)).toFixed()
    const unStakeInfo = stakeInfos.filter(it => new BigNumber(it.unlockTime).comparedTo(unixDate) <= 0)
    const lockStakeInfo = stakeInfos.filter(it => new BigNumber(it.unlockTime).comparedTo(unixDate) > 0)
    stakeDetail.unStakeAmount = unStakeInfo.map(it => new BigNumber(it.tokenIdOrAmount).div(10 ** stakeTokenInfo.decimals).toFixed()).reduce((pre, cur) => new BigNumber(pre).plus(cur).toFixed(), '0')
    stakeDetail.lockAmount = lockStakeInfo.map(it => new BigNumber(it.tokenIdOrAmount).div(10 ** stakeTokenInfo.decimals).toFixed()).reduce((pre, cur) => new BigNumber(pre).plus(cur).toFixed(), '0')
    stakeDetail.userTier = new BigNumber(getUserTier).toNumber()
    stakeDetail.stake = async (connect, amount) => {
      const realAmount = new BigNumber(amount).multipliedBy(10 ** stakeDetail.token.decimals).toFixed(0, BigNumber.ROUND_DOWN)
      return connect.create(StakingPoolContract).stakeNativeToken(realAmount)
    }

    stakeDetail.unStake = async (connect) => {
      const ids = unStakeInfo.map(it => it.id).slice(0, 10)
      if (ids.length === 0)
        throw new BasicException('No unstake')

      return connect.create(StakingPoolContract).unstake(ids)
    }
    return stakeDetail
  }

  private async getTokenPriceHistory(token: string): Promise<{
    ath: string
    last: string
  }> {
    const priceCache = PriceCache.get(token.toLowerCase())
    if (priceCache && Date.now() - priceCache.time < 1000 * 60 * 5)
      return priceCache.price

    const {tokenDayDatas} = await this.baseApi.exchangeV3Graph<{ tokenDayDatas: any[] }>(
      QueryTokenATHPriceHistory,
      {
        token: token.toLowerCase(),
      },
    )
    const tokenPrice = {
      ath: '0',
      last: '0',
    }
    tokenPrice.ath = tokenDayDatas.map(it => it.high).reduce((a, b) => new BigNumber(a).gt(b) ? a : b, '0')
    tokenPrice.last = get(tokenDayDatas, '[0].priceUSD', '0')
    PriceCache.set(token.toLowerCase(), {
      time: Date.now(),
      price: tokenPrice,
    })
    return tokenPrice
  }

  private async fetchPools(): Promise<LaunchpadInfo[]> {
    const {lauchpad_infos: lauchpadInfos} = await this.baseApi.request<{ lauchpad_infos: LaunchpadInfo[] }>(
      `${this.baseApi.address().baseApiUrl}/lauchpad/api/listalllauchpad?page=0&size=1000`,
      'get',
      {},
    )
    lauchpadInfos.forEach((it) => {
      if (it.raising_token && it.raising_token_icon)
        TokenLogoCache.set(it.raising_token.toLowerCase(), it.raising_token_icon)

      if (it.selling_token && it.selling_token_icon)
        TokenLogoCache.set(it.selling_token.toLowerCase(), it.selling_token_icon)
    })
    return lauchpadInfos
  }

  async getTokenPrice(address: string) {
    return (await this.getTokenPriceHistory(address)).last
  }

  async getAllTimeHighPrice(address: string) {
    return (await this.getTokenPriceHistory(address)).ath
  }

  async getPools() {
    const [res, launchpadInfos] = await Promise.all([
      this.baseApi.launchpadGraph(QueryIdoPoolInfosGQL, {}),
      this.fetchPools(),
    ])
    const allProject: IDOPool[] = res.idoPools
      // .filter(item=> set.has(item.id.toLowerCase()))
      .map((item: any) => {
        const idoPool = new IDOPool()
        idoPool.id = item.id
        idoPool.raisingTokenPrice = '0'
        idoPool.sellingTokenATHPrice = '0'
        idoPool.raisingTokenATHPrice = '0'
        idoPool.raisingAmount = new BigNumber(item.totalRaised).plus(item.totalExtraDeposit).toFixed()
        idoPool.expectedRaisingAmount = '0'
        idoPool.publicSalePrice = item.publicSalePrice
        idoPool.presalePrice = item.presalePrice
        idoPool.raisingTokenInfo = item.raisingTokenInfo as IDOToken
        idoPool.sellingTokenInfo = item.sellingTokenInfo as IDOToken
        idoPool.raisingTokenLogo = TokenLogoCache.get(idoPool.raisingTokenInfo.id.toLowerCase())
        idoPool.sellingTokenLogo = TokenLogoCache.get(idoPool.sellingTokenInfo.id.toLowerCase())
        idoPool.roi = '0'
        idoPool.presaleAndEnrollStartTime = Number.parseInt(item.presaleAndEnrollStartTime, 10)
        idoPool.publicSaleDepositEndTime = Number.parseInt(item.publicSaleDepositEndTime, 10)
        idoPool.soldOut = Number.parseInt(item.claimStartTime, 10) * 1000 < Date.now()
        return idoPool
      })

    const idoPoolStatistics = new IdoPoolStatistic()
    idoPoolStatistics.fundedProjects = new BigNumber(allProject.length).toFixed()
    idoPoolStatistics.totalParticipants = get(res, 'idoPoolStatistics.totalParticipants', '0')
    idoPoolStatistics.raisedCapital = '0'

    // INIT CACHE
    await Promise.all(
      Array.from(new Set([...allProject.map(p => p.raisingTokenInfo.id), ...allProject.map(p => p.raisingTokenInfo.id)]))
        .map((it: any) => this.getTokenPrice(it)),
    )

    const tokenPrices = await Promise.all(allProject.map(it => this.getTokenPrice(it.raisingTokenInfo.id)))
    const athTokenPrices = await Promise.all(allProject.map(it => this.getAllTimeHighPrice(it.sellingTokenInfo.id)))
    const athRaisingTokenPrices = await Promise.all(allProject.map(it => this.getAllTimeHighPrice(it.raisingTokenInfo.id)))

    for (let i = 0; i < allProject.length; i++) {
      const it = allProject[i]
      const price = tokenPrices[i]
      const athPrice = athTokenPrices[i]
      const athRaisingTokenPrice = athRaisingTokenPrices[i]

      it.raisingTokenPrice = price

      it.sellingTokenATHPrice = athPrice
      it.raisingTokenATHPrice = athRaisingTokenPrice

      const idoPrice = BigNumber.min(it.publicSalePrice, it.presalePrice).multipliedBy(it.raisingTokenPrice)
      if (idoPrice.comparedTo(0) === 0)

        it.roi = '0'

      else

        it.roi = new BigNumber(athPrice).div(idoPrice).toFixed(2, BigNumber.ROUND_DOWN)

      if (it.presaleAndEnrollStartTime < Date.now() / 1000) {
        idoPoolStatistics.raisedCapital = new BigNumber(idoPoolStatistics.raisedCapital).plus(new BigNumber(it.raisingAmount).multipliedBy(new BigNumber(it.raisingTokenATHPrice))).toFixed()
      } else {
        const launchpadInfo = launchpadInfos.find(info => info.selling_token.toLowerCase() === it.sellingTokenInfo.id.toLowerCase())
        if (launchpadInfo)
          it.expectedRaisingAmount = launchpadInfo.total_raise
      }
    }

    const poolInfo = {
      idoPoolStatistics,
      allProject,
      upcomingProjects: Array.from(allProject).filter((it) => it.presaleAndEnrollStartTime > Date.now() / 1000 ),
      ended: Array.from(allProject)
        .filter((it) => it.publicSaleDepositEndTime < Date.now() / 1000),
      comingProjects: Array.from(allProject)
        .filter((it) => it.presaleAndEnrollStartTime < Date.now() / 1000 && it.publicSaleDepositEndTime > Date.now() / 1000)
        .sort((a, b) => {
          const comparedTo = new BigNumber(a.soldOut ? 1 : 0).comparedTo(new BigNumber(b.soldOut ? 1 : 0));
          if (comparedTo  !== 0) {
            return comparedTo;
          }
          return b.presaleAndEnrollStartTime - a.presaleAndEnrollStartTime
        }),
    } as IdoPoolInfos
    Trace.debug('poolInfo', poolInfo)
    return poolInfo
  }

  private async getUserDepositedLogsByPool(user: string, pool: string): Promise<IDOUserDepositInfo> {
    const res = await this.baseApi.launchpadGraph(
      QueryIDOUserDepositedLogsByPool,
      {
        user: user.toLowerCase(),
        pool: pool.toLowerCase(),
      },
    )
    const userDepositInfo = new IDOUserDepositInfo()
    userDepositInfo.refund = res.idoPoolClaimedLogs.map((it: any) => it.refund).reduce((a: any, b: any) => new BigNumber(a).plus(b).toFixed(), '0')
    userDepositInfo.extraDeposit = res.idoPoolPublicSaleDepositedLogs.map((it: any) => it.extraDeposit).reduce((a: any, b: any) => new BigNumber(a).plus(b).toFixed(), '0')
    userDepositInfo.presaleQuote = res.idoPoolPresaleDepositedLogs.map((it: any) => it.buyQuota).reduce((a: any, b: any) => new BigNumber(a).plus(b).toFixed(), '0')
    userDepositInfo.presaleBuyInsurance = res.idoPoolPresaleDepositedLogs.map((it: any) => it.buyInsurance)[0] || false
    userDepositInfo.publicSaleQuota = res.idoPoolPublicSaleDepositedLogs.map((it: any) => it.buyQuota).reduce((a: any, b: any) => new BigNumber(a).plus(b).toFixed(), '0')
    userDepositInfo.publicSaleBuyInsurance = res.idoPoolPublicSaleDepositedLogs.map((it: any) => it.buyInsurance)[0] || false
    return userDepositInfo
  }

  private async getPoolInfoByGql(id: string): Promise<{
    poolInfo: IDOPoolInfo
    launchpadInfo: LaunchpadInfo
  }> {
    const [res, launchpadInfos] = await Promise.all([
      this.baseApi.launchpadGraph(QueryIDOPoolInfo, {
        id,
      }),
      this.fetchPools(),
    ])
    const poolInfo = res.idoPool as IDOPoolInfo
    poolInfo.raisingTokenLogo = TokenLogoCache.get(poolInfo.raisingTokenInfo.id.toLowerCase())
    poolInfo.sellingTokenLogo = TokenLogoCache.get(poolInfo.sellingTokenInfo.id.toLowerCase())
    const launchpadInfo = launchpadInfos.find(info => info.selling_token.toLowerCase() === poolInfo.sellingTokenInfo.id.toLowerCase())
    return {
      poolInfo,
      launchpadInfo,
    }
  }

  async poolDetail(pool: string, account: string = '') {
    const userAddress = account || INVALID_ADDRESS

    const [{
      poolInfo,
      launchpadInfo,
    }, userDepositInfo] = await Promise.all([
      this.getPoolInfoByGql(pool.toLowerCase()),
      this.getUserDepositedLogsByPool(userAddress.toLowerCase(), pool.toLowerCase()),
    ])
    const insurancePool = this.baseApi.connectInfo().create(InsurancePoolContract)
    const idoPool = this.baseApi.connectInfo().create(IdoPoolContract, pool)
    const stakingPool = this.baseApi.connectInfo().create(StakingPoolContract)
    const multiCall = this.baseApi.connectInfo().multiCall()
    const tokenIns = this.baseApi.connectInfo().create(ERC20Contract, poolInfo.sellingTokenInfo.id)

    const [
      insurancePoolData,
      idoPoolData,
      {getCurrentBlockTimestamp},
      {getUserTier},
      {totalSupply},
    ] = await multiCall
      .call({
        isRegisteredPool: insurancePool.mulContract.isRegisteredPool(pool),
        getIdoPoolInfo: insurancePool.mulContract.getIdoPoolInfo(pool),
      }, {
        getUserIDO: idoPool.mulContract.getUserIDO(pool),
        totalRaised: idoPool.mulContract.totalRaised(),
        getPresaleQuota: idoPool.mulContract.getPresaleQuota(userAddress),
        totalBuyedByUsers: idoPool.mulContract.totalBuyedByUsers(),
        totalSupply: idoPool.mulContract.totalSupply(),
        insuranceFeeRate: idoPool.mulContract.insuranceFeeRate(),
        getPublicSaleQuota: idoPool.mulContract.getPublicSaleQuota(userAddress),
        isEnrolled: idoPool.mulContract.isEnrolled(userAddress),
        presaleDeposited: idoPool.mulContract.presaleDeposited(userAddress),
        publicSaleDeposited: idoPool.mulContract.publicSaleDeposited(userAddress),
        totalExtraDeposit: idoPool.mulContract.totalExtraDeposit(),
        claimable: idoPool.mulContract.claimable(userAddress),
        refundable: idoPool.mulContract.refundable(userAddress),
      }, {
        getCurrentBlockTimestamp: multiCall.mulContract.getCurrentBlockTimestamp(),
      }, {
        getUserTier: stakingPool.mulContract.getUserTier(userAddress),
      }, {
        totalSupply: tokenIns.mulContract.totalSupply(),
      })

    const unixTime = Number.parseInt(getCurrentBlockTimestamp)

    const depositInfo = new IDODepositInfo()

    const raisingTokenDiv = 10 ** Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10)
    const sellingTokenDiv = 10 ** Number.parseInt(poolInfo.sellingTokenInfo.decimals, 10)

    const {[poolInfo.raisingTokenInfo.id]: token} = await this.baseApi.address().getApi().tokenMangerApi().batchGetTokens([poolInfo.raisingTokenInfo.id])

    depositInfo.raisingBalance = (await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(
      userAddress,
      pool,
      [token],
    ))[token.address]

    depositInfo.whiteList = {
      type: 'whiteList',
      canDeposit: Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime && (!(idoPoolData.presaleDeposited as boolean)),
      // 是否质押
      deposited: idoPoolData.presaleDeposited as boolean,
      // 白名单可用额度
      quota: new BigNumber(idoPoolData.getPresaleQuota).dividedBy(sellingTokenDiv).toFixed(),
      raising: new BigNumber(idoPoolData.getPresaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
      price: poolInfo.presalePrice,
      depositAmount: new BigNumber(userDepositInfo.presaleQuote).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
      maxDepositAmount: new BigNumber(idoPoolData.getPresaleQuota)
        .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
      insurance: userDepositInfo.presaleBuyInsurance,
      countdownEndTime: 0,
      depositStatus: 'disabled',
      payCompensation: '0',
      payCompensationState: 'hidden',
      payCompensationDate: 0,
      insuranceId: '',
    }
    depositInfo.publicSale = {
      type: 'publicSale',
      canDeposit: Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) <= unixTime && Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) >= unixTime && (!(idoPoolData.publicSaleDeposited as boolean)),
      deposited: idoPoolData.publicSaleDeposited as boolean,
      quota: new BigNumber(idoPoolData.getPublicSaleQuota).dividedBy(sellingTokenDiv).toFixed(),
      raising: new BigNumber(idoPoolData.getPublicSaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
      price: poolInfo.publicSalePrice,
      depositAmount: new BigNumber(userDepositInfo.publicSaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
      maxDepositAmount: new BigNumber(idoPoolData.getPublicSaleQuota)
        .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
      extraDepositAmount: new BigNumber(userDepositInfo.extraDeposit).dividedBy(raisingTokenDiv).toFixed(),
      insurance: userDepositInfo.publicSaleBuyInsurance,
      countdownEndTime: 0,
      depositStatus: 'disabled',
      payCompensation: '0',
      payCompensationState: 'hidden',
      payCompensationDate: 0,
      insuranceId: '',
    }

    depositInfo.totalRaised = new BigNumber(poolInfo.totalRaised).toFixed()
    depositInfo.maxRaisingAmount = new BigNumber(poolInfo.publicQuota).multipliedBy(poolInfo.publicSalePrice).plus(
      new BigNumber(poolInfo.whiteListQuota).multipliedBy(poolInfo.presalePrice),
    ).toFixed()

    depositInfo.totalBuyByUsers = new BigNumber(idoPoolData.totalBuyedByUsers).dividedBy(sellingTokenDiv).toFixed()
    depositInfo.totalExtraDeposit = new BigNumber(idoPoolData.totalExtraDeposit).dividedBy(raisingTokenDiv).toFixed()
    depositInfo.totalSupply = new BigNumber(totalSupply).dividedBy(sellingTokenDiv).toFixed()
    depositInfo.avgPrice = new BigNumber(insurancePoolData.getIdoPoolInfo.avgPrice).dividedBy(raisingTokenDiv).toFixed()
    depositInfo.needToPay = new BigNumber(insurancePoolData.getIdoPoolInfo.needToPay).toFixed()

    depositInfo.insuranceFeeRate = new BigNumber(idoPoolData.insuranceFeeRate).dividedBy(100).toFixed()

    depositInfo.userTier = new BigNumber(getUserTier).toNumber()
    depositInfo.needUserTier = 1
    depositInfo.checkUserTier = depositInfo.userTier >= depositInfo.needUserTier
    depositInfo.canEnroll = (!(idoPoolData.isEnrolled as boolean)) && depositInfo.checkUserTier && Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime
    depositInfo.isEnroll = idoPoolData.isEnrolled as boolean

    depositInfo.claimableAmount = new BigNumber(idoPoolData.claimable).dividedBy(sellingTokenDiv).toFixed()
    depositInfo.extraDepositRefund = new BigNumber(idoPoolData.refundable[0]).dividedBy(raisingTokenDiv).toFixed()

    if (new BigNumber(idoPoolData.refundable[1]).comparedTo('0') > 0) {
      depositInfo.publicSale.extraDepositAmount = new BigNumber(idoPoolData.refundable[1])
        .dividedBy(sellingTokenDiv)
        .multipliedBy(poolInfo.publicSalePrice)
        .toFixed()
    } else if (new BigNumber(userDepositInfo.refund).comparedTo('0') > 0) {
      const extraDepositAmount = new BigNumber(userDepositInfo.extraDeposit).minus(userDepositInfo.refund).div(raisingTokenDiv).toFixed()
      depositInfo.publicSale.extraDepositAmount = extraDepositAmount
    }

    if (depositInfo.whiteList.canDeposit) {
      depositInfo.currentDeposit = depositInfo.whiteList
      depositInfo.depositMaxInput = new BigNumber(idoPoolData.getPresaleQuota)
        .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice)
        .toFixed()
      depositInfo.maxExtraDeposit = '0'
      depositInfo.triggerExtraDeposit = '0'
    }

    if (depositInfo.publicSale.canDeposit) {
      depositInfo.currentDeposit = depositInfo.publicSale
      depositInfo.depositMaxInput = new BigNumber(idoPoolData.getPublicSaleQuota)
        .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice)
        .toFixed(Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10), BigNumber.ROUND_DOWN)
      depositInfo.maxExtraDeposit = new BigNumber(depositInfo.depositMaxInput)
        .multipliedBy(3)
        .toFixed(Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10), BigNumber.ROUND_DOWN)
      depositInfo.triggerExtraDeposit = depositInfo.depositMaxInput
    }

    depositInfo.claimLoss = (connect: ConnectInfo, insuranceId: string) => {
      return connect.create(InsurancePoolContract).claimLoss(insuranceId)
    }

    depositInfo.enroll = async (connect) => {
      return connect.create(IdoPoolContract, pool).enroll()
    }

    depositInfo.claim = async (connect) => {
      return connect.create(IdoPoolContract, pool).claim()
    }

    depositInfo.calculateInsuranceFee = (depositAmount: string) => {
      return new BigNumber(depositAmount).multipliedBy(depositInfo.insuranceFeeRate).toFixed(0, BigNumber.ROUND_DOWN)
    }

    depositInfo.calculateQuote = (depositAmount: string) => {
      let depositAmountBN = new BigNumber(depositAmount)
      if (!isNumber(depositAmount))
        depositAmountBN = new BigNumber('0')

      if (!depositInfo.currentDeposit || !depositInfo.currentDeposit.canDeposit)
        return '0'

      if (depositInfo.currentDeposit.type === 'whiteList')
        return depositAmountBN.dividedBy(poolInfo.presalePrice).toFixed(Number.parseInt(poolInfo.sellingTokenInfo.decimals), BigNumber.ROUND_DOWN)

      return depositAmountBN.dividedBy(poolInfo.publicSalePrice).toFixed(Number.parseInt(poolInfo.sellingTokenInfo.decimals), BigNumber.ROUND_DOWN)
    }

    depositInfo.deposit = async (connect, buyInsurance: boolean, depositAmount: string, extraDeposit: string) => {
      if (!depositInfo.currentDeposit.canDeposit)
        throw new Error('not in deposit time')

      const eqMax = new BigNumber(depositAmount).comparedTo(depositInfo.depositMaxInput) === 0
      if (depositInfo.currentDeposit.type === 'whiteList') {
        let buyQuota = new BigNumber(depositAmount).dividedBy(poolInfo.presalePrice).multipliedBy(sellingTokenDiv).toFixed(0, BigNumber.ROUND_DOWN)
        if (eqMax)
          buyQuota = new BigNumber(idoPoolData.getPresaleQuota.toString()).toFixed(0, BigNumber.ROUND_DOWN)

        return connect.create(IdoPoolContract, pool).presaleDeposit(buyQuota, buyInsurance)
      }
      let buyQuota = new BigNumber(depositAmount).dividedBy(poolInfo.publicSalePrice).multipliedBy(sellingTokenDiv).toFixed(0, BigNumber.ROUND_DOWN)
      if (eqMax)
        buyQuota = new BigNumber(idoPoolData.getPublicSaleQuota.toString()).toFixed(0, BigNumber.ROUND_DOWN)

      const extraDepositReal = new BigNumber(extraDeposit || '0').multipliedBy(raisingTokenDiv).toFixed(0, BigNumber.ROUND_DOWN)
      return connect.create(IdoPoolContract, pool).publicSaleDeposit(buyInsurance, buyQuota, extraDepositReal)
    }

    if (new BigNumber(poolInfo.claimStartTime).comparedTo(unixTime) < 0) {
      // 没参与，白名单已结束
      if (depositInfo.whiteList.depositAmount === '0' && depositInfo.publicSale.depositAmount === '0')
        depositInfo.timeState = 'Finished'
      else
        depositInfo.timeState = 'Claiming'

      depositInfo.claimStatus = 'enable'
      depositInfo.whiteList.countdownEndTime = 0
      depositInfo.publicSale.countdownEndTime = 0
    } else {
      depositInfo.timeState = 'Deposit'
      depositInfo.claimStatus = 'disabled'
      depositInfo.whiteList.depositStatus = 'disabled'
      depositInfo.publicSale.depositStatus = 'disabled'
      depositInfo.whiteList.countdownEndTime = 0
      depositInfo.publicSale.countdownEndTime = 0
      if (Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime) {
        // 白名单时间段，没质押，有可用额度
        if (!(idoPoolData.presaleDeposited as boolean) && Number.parseFloat(depositInfo.whiteList.maxDepositAmount) > 0)
          depositInfo.whiteList.depositStatus = 'enable'
      } else if (Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) <= unixTime && Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) >= unixTime) {
        // 存在(白名单和公售)质押的情况 或者 可质押额度>0
        if (Number.parseFloat(depositInfo.publicSale.depositAmount) > 0 || Number.parseFloat(depositInfo.whiteList.depositAmount) > 0
          || Number.parseFloat(depositInfo.publicSale.maxDepositAmount) > Number.parseFloat(depositInfo.publicSale.depositAmount)) {
          if ((!idoPoolData.publicSaleDeposited as boolean)
            && (idoPoolData.isEnrolled as boolean)
            && Number.parseFloat(depositInfo.publicSale.maxDepositAmount) > Number.parseFloat(depositInfo.publicSale.depositAmount))
            depositInfo.publicSale.depositStatus = 'enable'
        } else {
          depositInfo.timeState = 'Finished'
        }
      }
      if (Number.parseInt(poolInfo.claimStartTime, 10) > unixTime) {
        depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.claimStartTime, 10)
        depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.claimStartTime, 10)
      }

      if (Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) > unixTime)
        depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.publicSaleDepositEndTime, 10)

      if (Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) > unixTime)
        depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.publicSaleDepositStartTime, 10)

      if (Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) > unixTime)
        depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10)

      if (Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) > unixTime)
        depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10)
    }

    const idoByUser = idoPoolData.getUserIDO as any
    if (depositInfo.claimStatus === 'enable') {
      if (new BigNumber(depositInfo.avgPrice).comparedTo('0') > 0) {
        const insuranceDetails = await multiCall.call(
          idoByUser.insuranceIds.map((it: any) => {
            return {
              getInsuranceDetail: insurancePool.mulContract.getInsuranceDetail(it),
            }
          }),
        )

        const handleInsuranceDetails = (depositData: any, insuranceDetail: any, insuranceId: any) => {
          const result = insuranceDetail.getInsuranceDetail as any
          const payAmount = new BigNumber(result.buyQuota.toString()).div(sellingTokenDiv).multipliedBy(
            new BigNumber(result.price.toString()).div(raisingTokenDiv).minus(depositInfo.avgPrice),
          ).toFixed()

          depositData.insuranceId = new BigNumber(insuranceId).toFixed()
          if (new BigNumber(payAmount).comparedTo('0') <= 0) {
            depositData.payCompensationState = 'noClaim'
          } else {
            depositData.payCompensation = payAmount

            depositData.payCompensationState = result.lossClaimed as boolean ? 'received' : 'claim'
          }
        }

        if (depositInfo.whiteList.insurance && depositInfo.publicSale.insurance) {
          handleInsuranceDetails(depositInfo.whiteList, insuranceDetails[0], idoByUser.insuranceIds[0])
          handleInsuranceDetails(depositInfo.publicSale, insuranceDetails[1], idoByUser.insuranceIds[1])
        } else if (depositInfo.whiteList.insurance) {
          handleInsuranceDetails(depositInfo.whiteList, insuranceDetails[0], idoByUser.insuranceIds[0])
        } else if (depositInfo.publicSale.insurance) {
          handleInsuranceDetails(depositInfo.publicSale, insuranceDetails[0], idoByUser.insuranceIds[0])
        }
      } else {
        // 检查是不是wait
        const time = get(launchpadInfo, 'redemption_time', '0')
        // 如果未到时间
        let state: 'disabled' | 'wait' = 'disabled'
        const payCompensationDate = +time + (60 * 60 * 24 * 7)
        if (new BigNumber(time).comparedTo('0') > 0)
          state = 'wait'

        // 如果没有时间
        if (depositInfo.whiteList.insurance) {
          depositInfo.whiteList.payCompensationState = state
          depositInfo.whiteList.payCompensationDate = payCompensationDate
        }
        if (depositInfo.publicSale.insurance) {
          depositInfo.publicSale.payCompensationState = state
          depositInfo.publicSale.payCompensationDate = payCompensationDate
        }
      }
    }

    const raisingTokenPrice = await this.getTokenPrice(poolInfo.raisingTokenInfo.id)
    const poolDetail = new IDOPoolDetail()

    poolDetail.tier = depositInfo.userTier

    poolDetail.depositInfo = depositInfo
    poolDetail.pool = poolInfo

    poolDetail.insurance = insurancePoolData.isRegisteredPool as boolean

    // 当前用户额度
    poolDetail.whitelistSaleQuota = new BigNumber(idoPoolData.getPresaleQuota.toString()).dividedBy(sellingTokenDiv).toFixed()
    // 白名单额度
    poolDetail.whitelistAllocationTokenAmount = poolInfo.whiteListQuota
    // 总出售 - 白名单额度
    poolDetail.publicAllocation = BigNumber.max(new BigNumber(get(launchpadInfo, 'pool_size', '0')).minus(poolInfo.whiteListQuota), '0').toFixed()
    poolDetail.launchpadTotalRaise = new BigNumber(idoPoolData.totalRaised.toString()).dividedBy(raisingTokenDiv).multipliedBy(raisingTokenPrice).toFixed()
    poolDetail.tokenTotalSupply = new BigNumber(idoPoolData.totalSupply.toString()).dividedBy(sellingTokenDiv).toFixed()

    if (launchpadInfo) {
      poolDetail.poolSize = get(launchpadInfo, 'pool_size', '')
      poolDetail.initialMarketCap = get(launchpadInfo, 'initial_market_cap', '')
      poolDetail.FDV = get(launchpadInfo, 'fdv', '')
      poolDetail.tags = get(launchpadInfo, 'selling_token_tag', '')
      poolDetail.whitelistStakingTierRequired = get(launchpadInfo, 'whitelist_staking_tier_required', '')
      poolDetail.whitelistRegistrationRequired = get(launchpadInfo, 'whitelist_registration_required', '')
      poolDetail.whitelistDistribution = get(launchpadInfo, 'whitelist_distribution', '')
      poolDetail.publicStakingTierRequired = get(launchpadInfo, 'public_registration_required', '')
      poolDetail.publicRegistrationRequired = get(launchpadInfo, 'public_registration_required', '')
      poolDetail.publicDistribution = get(launchpadInfo, 'public_distribution', '')
      poolDetail.introduction = get(launchpadInfo, 'introduction', '')
      poolDetail.shares = get(launchpadInfo, 'shares', []).filter(it => it.icon)
    } else {
      poolDetail.poolSize = ''
      poolDetail.initialMarketCap = ''
      poolDetail.FDV = ''
      poolDetail.whitelistStakingTierRequired = 'No'
      poolDetail.whitelistRegistrationRequired = 'No'
      poolDetail.whitelistDistribution = ''
      poolDetail.publicStakingTierRequired = 'Yes'
      poolDetail.publicRegistrationRequired = 'Yes'
      poolDetail.publicDistribution = ''
      poolDetail.introduction = ''
      poolDetail.shares = []
    }
    return poolDetail
  }
}
