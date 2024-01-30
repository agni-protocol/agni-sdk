"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaunchpadApi = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const get_1 = __importDefault(require("lodash/get"));
const vo_1 = require("../vo");
const abi_1 = require("../abi");
const BasicException_1 = require("../../BasicException");
const tool_1 = require("../tool");
const LaunchpadGql_1 = require("./gql/LaunchpadGql");
const BaseApi_1 = require("./BaseApi");
const PriceCache = new Map();
const TokenLogoCache = new Map();
let LaunchpadApi = class LaunchpadApi {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    async getUserStakeInfoByGql(user, token) {
        const res = await this.baseApi.launchpadGraph(LaunchpadGql_1.UserStakeInfosGQL, {
            user: user.toLowerCase(),
            token: token.toLowerCase(),
        });
        return res.stakeInfos;
    }
    async staking(account = '') {
        const userAddress = account || tool_1.INVALID_ADDRESS;
        const tokenAddress = this.baseApi.address().launchpadStakeToken;
        const launchpadStakePoolAddress = this.baseApi.address().launchpadStakePool;
        const stakingPoolAbi = this.baseApi.connectInfo().create(abi_1.StakingPoolContract);
        const [stakeInfos, batchGetTokens, { getScoreByTier, getUserScore, getUserTier, },] = await Promise.all([
            this.getUserStakeInfoByGql(userAddress, tokenAddress),
            this.baseApi.address().getApi().tokenMangerApi().batchGetTokens([vo_1.ETH_ADDRESS]),
            this.baseApi.connectInfo().multiCall()
                .singleCall({
                getScoreByTier: stakingPoolAbi.mulContract.getScoreByTier('1'),
                getUserScore: stakingPoolAbi.mulContract.getUserScore(userAddress),
                getUserTier: stakingPoolAbi.mulContract.getUserTier(userAddress),
            }),
        ]);
        const stakeTokenInfo = batchGetTokens[vo_1.ETH_ADDRESS];
        const { [stakeTokenInfo.address]: balanceAndAllowances } = await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(userAddress, launchpadStakePoolAddress, [stakeTokenInfo]);
        const unixDate = new Date().getTime() / 1000;
        const stakeDetail = new vo_1.LaunchpadStakeDetail();
        stakeDetail.token = stakeTokenInfo;
        stakeDetail.balance = balanceAndAllowances;
        stakeDetail.minInputAmount = bignumber_js_1.default.max(new bignumber_js_1.default(getScoreByTier).minus(getUserScore).dividedBy(1e8), new bignumber_js_1.default(1).div(1e8)).toFixed();
        const unStakeInfo = stakeInfos.filter(it => new bignumber_js_1.default(it.unlockTime).comparedTo(unixDate) <= 0);
        const lockStakeInfo = stakeInfos.filter(it => new bignumber_js_1.default(it.unlockTime).comparedTo(unixDate) > 0);
        stakeDetail.unStakeAmount = unStakeInfo.map(it => new bignumber_js_1.default(it.tokenIdOrAmount).div(10 ** stakeTokenInfo.decimals).toFixed()).reduce((pre, cur) => new bignumber_js_1.default(pre).plus(cur).toFixed(), '0');
        stakeDetail.lockAmount = lockStakeInfo.map(it => new bignumber_js_1.default(it.tokenIdOrAmount).div(10 ** stakeTokenInfo.decimals).toFixed()).reduce((pre, cur) => new bignumber_js_1.default(pre).plus(cur).toFixed(), '0');
        stakeDetail.userTier = new bignumber_js_1.default(getUserTier).toNumber();
        stakeDetail.stake = async (connect, amount) => {
            const realAmount = new bignumber_js_1.default(amount).multipliedBy(10 ** stakeDetail.token.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
            return connect.create(abi_1.StakingPoolContract).stakeNativeToken(realAmount);
        };
        stakeDetail.unStake = async (connect) => {
            const ids = unStakeInfo.map(it => it.id).slice(0, 10);
            if (ids.length === 0)
                throw new BasicException_1.BasicException('No unstake');
            return connect.create(abi_1.StakingPoolContract).unstake(ids);
        };
        return stakeDetail;
    }
    async getTokenPriceHistory(token) {
        const priceCache = PriceCache.get(token.toLowerCase());
        if (priceCache && Date.now() - priceCache.time < 1000 * 60 * 5)
            return priceCache.price;
        const { tokenDayDatas } = await this.baseApi.exchangeV3Graph(LaunchpadGql_1.QueryTokenATHPriceHistory, {
            token: token.toLowerCase(),
        });
        const tokenPrice = {
            ath: '0',
            last: '0',
        };
        tokenPrice.ath = tokenDayDatas.map(it => it.high).reduce((a, b) => new bignumber_js_1.default(a).gt(b) ? a : b, '0');
        tokenPrice.last = (0, get_1.default)(tokenDayDatas, '[0].priceUSD', '0');
        PriceCache.set(token.toLowerCase(), {
            time: Date.now(),
            price: tokenPrice,
        });
        return tokenPrice;
    }
    async fetchPools() {
        const { lauchpad_infos: lauchpadInfos } = await this.baseApi.request(`${this.baseApi.address().baseApiUrl}/lauchpad/api/listalllauchpad?page=0&size=1000`, 'get', {});
        lauchpadInfos.forEach((it) => {
            if (it.raising_token && it.raising_token_icon)
                TokenLogoCache.set(it.raising_token.toLowerCase(), it.raising_token_icon);
            if (it.selling_token && it.selling_token_icon)
                TokenLogoCache.set(it.selling_token.toLowerCase(), it.selling_token_icon);
        });
        return lauchpadInfos;
    }
    async getTokenPrice(address) {
        return (await this.getTokenPriceHistory(address)).last;
    }
    async getAllTimeHighPrice(address) {
        return (await this.getTokenPriceHistory(address)).ath;
    }
    async getPools() {
        const [res, launchpadInfos] = await Promise.all([
            this.baseApi.launchpadGraph(LaunchpadGql_1.QueryIdoPoolInfosGQL, {}),
            this.fetchPools(),
        ]);
        const allProject = res.idoPools
            // .filter(item=> set.has(item.id.toLowerCase()))
            .map((item) => {
            const idoPool = new vo_1.IDOPool();
            idoPool.id = item.id;
            idoPool.raisingTokenPrice = '0';
            idoPool.sellingTokenATHPrice = '0';
            idoPool.raisingTokenATHPrice = '0';
            idoPool.raisingAmount = new bignumber_js_1.default(item.totalRaised).plus(item.totalExtraDeposit).toFixed();
            idoPool.expectedRaisingAmount = '0';
            idoPool.publicSalePrice = item.publicSalePrice;
            idoPool.presalePrice = item.presalePrice;
            idoPool.raisingTokenInfo = item.raisingTokenInfo;
            idoPool.sellingTokenInfo = item.sellingTokenInfo;
            idoPool.raisingTokenLogo = TokenLogoCache.get(idoPool.raisingTokenInfo.id.toLowerCase());
            idoPool.sellingTokenLogo = TokenLogoCache.get(idoPool.sellingTokenInfo.id.toLowerCase());
            idoPool.roi = '0';
            idoPool.presaleAndEnrollStartTime = Number.parseInt(item.presaleAndEnrollStartTime, 10);
            idoPool.publicSaleDepositEndTime = Number.parseInt(item.publicSaleDepositEndTime, 10);
            idoPool.soldOut = Number.parseInt(item.claimStartTime, 10) * 1000 < Date.now();
            return idoPool;
        });
        const idoPoolStatistics = new vo_1.IdoPoolStatistic();
        idoPoolStatistics.fundedProjects = new bignumber_js_1.default(allProject.length).toFixed();
        idoPoolStatistics.totalParticipants = (0, get_1.default)(res, 'idoPoolStatistics.totalParticipants', '0');
        idoPoolStatistics.raisedCapital = '0';
        // INIT CACHE
        await Promise.all(Array.from(new Set([...allProject.map(p => p.raisingTokenInfo.id), ...allProject.map(p => p.raisingTokenInfo.id)]))
            .map((it) => this.getTokenPrice(it)));
        const tokenPrices = await Promise.all(allProject.map(it => this.getTokenPrice(it.raisingTokenInfo.id)));
        const athTokenPrices = await Promise.all(allProject.map(it => this.getAllTimeHighPrice(it.sellingTokenInfo.id)));
        const athRaisingTokenPrices = await Promise.all(allProject.map(it => this.getAllTimeHighPrice(it.raisingTokenInfo.id)));
        for (let i = 0; i < allProject.length; i++) {
            const it = allProject[i];
            const price = tokenPrices[i];
            const athPrice = athTokenPrices[i];
            const athRaisingTokenPrice = athRaisingTokenPrices[i];
            it.raisingTokenPrice = price;
            it.sellingTokenATHPrice = athPrice;
            it.raisingTokenATHPrice = athRaisingTokenPrice;
            const idoPrice = bignumber_js_1.default.min(it.publicSalePrice, it.presalePrice).multipliedBy(it.raisingTokenPrice);
            if (idoPrice.comparedTo(0) === 0)
                it.roi = '0';
            else
                it.roi = new bignumber_js_1.default(athPrice).div(idoPrice).toFixed(2, bignumber_js_1.default.ROUND_DOWN);
            if (it.presaleAndEnrollStartTime < Date.now() / 1000) {
                idoPoolStatistics.raisedCapital = new bignumber_js_1.default(idoPoolStatistics.raisedCapital).plus(new bignumber_js_1.default(it.raisingAmount).multipliedBy(new bignumber_js_1.default(it.raisingTokenATHPrice))).toFixed();
            }
            else {
                const launchpadInfo = launchpadInfos.find(info => info.selling_token.toLowerCase() === it.sellingTokenInfo.id.toLowerCase());
                if (launchpadInfo)
                    it.expectedRaisingAmount = launchpadInfo.total_raise;
            }
        }
        const poolInfo = {
            idoPoolStatistics,
            allProject,
            upcomingProjects: Array.from(allProject).filter((it) => it.presaleAndEnrollStartTime > Date.now() / 1000),
            ended: Array.from(allProject)
                .filter((it) => it.publicSaleDepositEndTime < Date.now() / 1000),
            comingProjects: Array.from(allProject)
                .filter((it) => it.presaleAndEnrollStartTime < Date.now() / 1000 && it.publicSaleDepositEndTime > Date.now() / 1000)
                .sort((a, b) => {
                const comparedTo = new bignumber_js_1.default(a.soldOut ? 1 : 0).comparedTo(new bignumber_js_1.default(b.soldOut ? 1 : 0));
                if (comparedTo !== 0) {
                    return comparedTo;
                }
                return b.presaleAndEnrollStartTime - a.presaleAndEnrollStartTime;
            }),
        };
        tool_1.Trace.debug('poolInfo', poolInfo);
        return poolInfo;
    }
    async getUserDepositedLogsByPool(user, pool) {
        const res = await this.baseApi.launchpadGraph(LaunchpadGql_1.QueryIDOUserDepositedLogsByPool, {
            user: user.toLowerCase(),
            pool: pool.toLowerCase(),
        });
        const userDepositInfo = new vo_1.IDOUserDepositInfo();
        userDepositInfo.refund = res.idoPoolClaimedLogs.map((it) => it.refund).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toFixed(), '0');
        userDepositInfo.extraDeposit = res.idoPoolPublicSaleDepositedLogs.map((it) => it.extraDeposit).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toFixed(), '0');
        userDepositInfo.presaleQuote = res.idoPoolPresaleDepositedLogs.map((it) => it.buyQuota).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toFixed(), '0');
        userDepositInfo.presaleBuyInsurance = res.idoPoolPresaleDepositedLogs.map((it) => it.buyInsurance)[0] || false;
        userDepositInfo.publicSaleQuota = res.idoPoolPublicSaleDepositedLogs.map((it) => it.buyQuota).reduce((a, b) => new bignumber_js_1.default(a).plus(b).toFixed(), '0');
        userDepositInfo.publicSaleBuyInsurance = res.idoPoolPublicSaleDepositedLogs.map((it) => it.buyInsurance)[0] || false;
        return userDepositInfo;
    }
    async getPoolInfoByGql(id) {
        const [res, launchpadInfos] = await Promise.all([
            this.baseApi.launchpadGraph(LaunchpadGql_1.QueryIDOPoolInfo, {
                id,
            }),
            this.fetchPools(),
        ]);
        const poolInfo = res.idoPool;
        poolInfo.raisingTokenLogo = TokenLogoCache.get(poolInfo.raisingTokenInfo.id.toLowerCase());
        poolInfo.sellingTokenLogo = TokenLogoCache.get(poolInfo.sellingTokenInfo.id.toLowerCase());
        const launchpadInfo = launchpadInfos.find(info => info.selling_token.toLowerCase() === poolInfo.sellingTokenInfo.id.toLowerCase());
        return {
            poolInfo,
            launchpadInfo,
        };
    }
    async poolDetail(pool, account = '') {
        const userAddress = account || tool_1.INVALID_ADDRESS;
        const [{ poolInfo, launchpadInfo, }, userDepositInfo] = await Promise.all([
            this.getPoolInfoByGql(pool.toLowerCase()),
            this.getUserDepositedLogsByPool(userAddress.toLowerCase(), pool.toLowerCase()),
        ]);
        const insurancePool = this.baseApi.connectInfo().create(abi_1.InsurancePoolContract);
        const idoPool = this.baseApi.connectInfo().create(abi_1.IdoPoolContract, pool);
        const stakingPool = this.baseApi.connectInfo().create(abi_1.StakingPoolContract);
        const multiCall = this.baseApi.connectInfo().multiCall();
        const tokenIns = this.baseApi.connectInfo().create(abi_1.ERC20Contract, poolInfo.sellingTokenInfo.id);
        const [insurancePoolData, idoPoolData, { getCurrentBlockTimestamp }, { getUserTier }, { totalSupply },] = await multiCall
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
        });
        const unixTime = Number.parseInt(getCurrentBlockTimestamp);
        const depositInfo = new vo_1.IDODepositInfo();
        const raisingTokenDiv = 10 ** Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10);
        const sellingTokenDiv = 10 ** Number.parseInt(poolInfo.sellingTokenInfo.decimals, 10);
        const { [poolInfo.raisingTokenInfo.id]: token } = await this.baseApi.address().getApi().tokenMangerApi().batchGetTokens([poolInfo.raisingTokenInfo.id]);
        depositInfo.raisingBalance = (await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(userAddress, pool, [token]))[token.address];
        depositInfo.whiteList = {
            type: 'whiteList',
            canDeposit: Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime && (!idoPoolData.presaleDeposited),
            // 是否质押
            deposited: idoPoolData.presaleDeposited,
            // 白名单可用额度
            quota: new bignumber_js_1.default(idoPoolData.getPresaleQuota).dividedBy(sellingTokenDiv).toFixed(),
            raising: new bignumber_js_1.default(idoPoolData.getPresaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
            price: poolInfo.presalePrice,
            depositAmount: new bignumber_js_1.default(userDepositInfo.presaleQuote).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
            maxDepositAmount: new bignumber_js_1.default(idoPoolData.getPresaleQuota)
                .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice).toFixed(),
            insurance: userDepositInfo.presaleBuyInsurance,
            countdownEndTime: 0,
            depositStatus: 'disabled',
            payCompensation: '0',
            payCompensationState: 'hidden',
            payCompensationDate: 0,
            insuranceId: '',
        };
        depositInfo.publicSale = {
            type: 'publicSale',
            canDeposit: Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) <= unixTime && Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) >= unixTime && (!idoPoolData.publicSaleDeposited),
            deposited: idoPoolData.publicSaleDeposited,
            quota: new bignumber_js_1.default(idoPoolData.getPublicSaleQuota).dividedBy(sellingTokenDiv).toFixed(),
            raising: new bignumber_js_1.default(idoPoolData.getPublicSaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
            price: poolInfo.publicSalePrice,
            depositAmount: new bignumber_js_1.default(userDepositInfo.publicSaleQuota).dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
            maxDepositAmount: new bignumber_js_1.default(idoPoolData.getPublicSaleQuota)
                .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice).toFixed(),
            extraDepositAmount: new bignumber_js_1.default(userDepositInfo.extraDeposit).dividedBy(raisingTokenDiv).toFixed(),
            insurance: userDepositInfo.publicSaleBuyInsurance,
            countdownEndTime: 0,
            depositStatus: 'disabled',
            payCompensation: '0',
            payCompensationState: 'hidden',
            payCompensationDate: 0,
            insuranceId: '',
        };
        depositInfo.totalRaised = new bignumber_js_1.default(poolInfo.totalRaised).toFixed();
        depositInfo.maxRaisingAmount = new bignumber_js_1.default(poolInfo.publicQuota).multipliedBy(poolInfo.publicSalePrice).plus(new bignumber_js_1.default(poolInfo.whiteListQuota).multipliedBy(poolInfo.presalePrice)).toFixed();
        depositInfo.totalBuyByUsers = new bignumber_js_1.default(idoPoolData.totalBuyedByUsers).dividedBy(sellingTokenDiv).toFixed();
        depositInfo.totalExtraDeposit = new bignumber_js_1.default(idoPoolData.totalExtraDeposit).dividedBy(raisingTokenDiv).toFixed();
        depositInfo.totalSupply = new bignumber_js_1.default(totalSupply).dividedBy(sellingTokenDiv).toFixed();
        depositInfo.avgPrice = new bignumber_js_1.default(insurancePoolData.getIdoPoolInfo.avgPrice).dividedBy(raisingTokenDiv).toFixed();
        depositInfo.needToPay = new bignumber_js_1.default(insurancePoolData.getIdoPoolInfo.needToPay).toFixed();
        depositInfo.insuranceFeeRate = new bignumber_js_1.default(idoPoolData.insuranceFeeRate).dividedBy(100).toFixed();
        depositInfo.userTier = new bignumber_js_1.default(getUserTier).toNumber();
        depositInfo.needUserTier = 1;
        depositInfo.checkUserTier = depositInfo.userTier >= depositInfo.needUserTier;
        depositInfo.canEnroll = (!idoPoolData.isEnrolled) && depositInfo.checkUserTier && Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime;
        depositInfo.isEnroll = idoPoolData.isEnrolled;
        depositInfo.claimableAmount = new bignumber_js_1.default(idoPoolData.claimable).dividedBy(sellingTokenDiv).toFixed();
        depositInfo.extraDepositRefund = new bignumber_js_1.default(idoPoolData.refundable[0]).dividedBy(raisingTokenDiv).toFixed();
        if (new bignumber_js_1.default(idoPoolData.refundable[1]).comparedTo('0') > 0) {
            depositInfo.publicSale.extraDepositAmount = new bignumber_js_1.default(idoPoolData.refundable[1])
                .dividedBy(sellingTokenDiv)
                .multipliedBy(poolInfo.publicSalePrice)
                .toFixed();
        }
        else if (new bignumber_js_1.default(userDepositInfo.refund).comparedTo('0') > 0) {
            const extraDepositAmount = new bignumber_js_1.default(userDepositInfo.extraDeposit).minus(userDepositInfo.refund).div(raisingTokenDiv).toFixed();
            depositInfo.publicSale.extraDepositAmount = extraDepositAmount;
        }
        if (depositInfo.whiteList.canDeposit) {
            depositInfo.currentDeposit = depositInfo.whiteList;
            depositInfo.depositMaxInput = new bignumber_js_1.default(idoPoolData.getPresaleQuota)
                .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.presalePrice)
                .toFixed();
            depositInfo.maxExtraDeposit = '0';
            depositInfo.triggerExtraDeposit = '0';
        }
        if (depositInfo.publicSale.canDeposit) {
            depositInfo.currentDeposit = depositInfo.publicSale;
            depositInfo.depositMaxInput = new bignumber_js_1.default(idoPoolData.getPublicSaleQuota)
                .dividedBy(sellingTokenDiv).multipliedBy(poolInfo.publicSalePrice)
                .toFixed(Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10), bignumber_js_1.default.ROUND_DOWN);
            depositInfo.maxExtraDeposit = new bignumber_js_1.default(depositInfo.depositMaxInput)
                .multipliedBy(3)
                .toFixed(Number.parseInt(poolInfo.raisingTokenInfo.decimals, 10), bignumber_js_1.default.ROUND_DOWN);
            depositInfo.triggerExtraDeposit = depositInfo.depositMaxInput;
        }
        depositInfo.claimLoss = (connect, insuranceId) => {
            return connect.create(abi_1.InsurancePoolContract).claimLoss(insuranceId);
        };
        depositInfo.enroll = async (connect) => {
            return connect.create(abi_1.IdoPoolContract, pool).enroll();
        };
        depositInfo.claim = async (connect) => {
            return connect.create(abi_1.IdoPoolContract, pool).claim();
        };
        depositInfo.calculateInsuranceFee = (depositAmount) => {
            return new bignumber_js_1.default(depositAmount).multipliedBy(depositInfo.insuranceFeeRate).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
        };
        depositInfo.calculateQuote = (depositAmount) => {
            let depositAmountBN = new bignumber_js_1.default(depositAmount);
            if (!(0, tool_1.isNumber)(depositAmount))
                depositAmountBN = new bignumber_js_1.default('0');
            if (!depositInfo.currentDeposit || !depositInfo.currentDeposit.canDeposit)
                return '0';
            if (depositInfo.currentDeposit.type === 'whiteList')
                return depositAmountBN.dividedBy(poolInfo.presalePrice).toFixed(Number.parseInt(poolInfo.sellingTokenInfo.decimals), bignumber_js_1.default.ROUND_DOWN);
            return depositAmountBN.dividedBy(poolInfo.publicSalePrice).toFixed(Number.parseInt(poolInfo.sellingTokenInfo.decimals), bignumber_js_1.default.ROUND_DOWN);
        };
        depositInfo.deposit = async (connect, buyInsurance, depositAmount, extraDeposit) => {
            if (!depositInfo.currentDeposit.canDeposit)
                throw new Error('not in deposit time');
            const eqMax = new bignumber_js_1.default(depositAmount).comparedTo(depositInfo.depositMaxInput) === 0;
            if (depositInfo.currentDeposit.type === 'whiteList') {
                let buyQuota = new bignumber_js_1.default(depositAmount).dividedBy(poolInfo.presalePrice).multipliedBy(sellingTokenDiv).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
                if (eqMax)
                    buyQuota = new bignumber_js_1.default(idoPoolData.getPresaleQuota.toString()).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
                return connect.create(abi_1.IdoPoolContract, pool).presaleDeposit(buyQuota, buyInsurance);
            }
            let buyQuota = new bignumber_js_1.default(depositAmount).dividedBy(poolInfo.publicSalePrice).multipliedBy(sellingTokenDiv).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
            if (eqMax)
                buyQuota = new bignumber_js_1.default(idoPoolData.getPublicSaleQuota.toString()).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
            const extraDepositReal = new bignumber_js_1.default(extraDeposit || '0').multipliedBy(raisingTokenDiv).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
            return connect.create(abi_1.IdoPoolContract, pool).publicSaleDeposit(buyInsurance, buyQuota, extraDepositReal);
        };
        if (new bignumber_js_1.default(poolInfo.claimStartTime).comparedTo(unixTime) < 0) {
            // 没参与，白名单已结束
            if (depositInfo.whiteList.depositAmount === '0' && depositInfo.publicSale.depositAmount === '0')
                depositInfo.timeState = 'Finished';
            else
                depositInfo.timeState = 'Claiming';
            depositInfo.claimStatus = 'enable';
            depositInfo.whiteList.countdownEndTime = 0;
            depositInfo.publicSale.countdownEndTime = 0;
        }
        else {
            depositInfo.timeState = 'Deposit';
            depositInfo.claimStatus = 'disabled';
            depositInfo.whiteList.depositStatus = 'disabled';
            depositInfo.publicSale.depositStatus = 'disabled';
            depositInfo.whiteList.countdownEndTime = 0;
            depositInfo.publicSale.countdownEndTime = 0;
            if (Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) <= unixTime && Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) >= unixTime) {
                // 白名单时间段，没质押，有可用额度
                if (!idoPoolData.presaleDeposited && Number.parseFloat(depositInfo.whiteList.maxDepositAmount) > 0)
                    depositInfo.whiteList.depositStatus = 'enable';
            }
            else if (Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) <= unixTime && Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) >= unixTime) {
                // 存在(白名单和公售)质押的情况 或者 可质押额度>0
                if (Number.parseFloat(depositInfo.publicSale.depositAmount) > 0 || Number.parseFloat(depositInfo.whiteList.depositAmount) > 0
                    || Number.parseFloat(depositInfo.publicSale.maxDepositAmount) > Number.parseFloat(depositInfo.publicSale.depositAmount)) {
                    if (!idoPoolData.publicSaleDeposited
                        && idoPoolData.isEnrolled
                        && Number.parseFloat(depositInfo.publicSale.maxDepositAmount) > Number.parseFloat(depositInfo.publicSale.depositAmount))
                        depositInfo.publicSale.depositStatus = 'enable';
                }
                else {
                    depositInfo.timeState = 'Finished';
                }
            }
            if (Number.parseInt(poolInfo.claimStartTime, 10) > unixTime) {
                depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.claimStartTime, 10);
                depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.claimStartTime, 10);
            }
            if (Number.parseInt(poolInfo.publicSaleDepositEndTime, 10) > unixTime)
                depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.publicSaleDepositEndTime, 10);
            if (Number.parseInt(poolInfo.publicSaleDepositStartTime, 10) > unixTime)
                depositInfo.publicSale.countdownEndTime = Number.parseInt(poolInfo.publicSaleDepositStartTime, 10);
            if (Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10) > unixTime)
                depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.presaleAndEnrollEndTime, 10);
            if (Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10) > unixTime)
                depositInfo.whiteList.countdownEndTime = Number.parseInt(poolInfo.presaleAndEnrollStartTime, 10);
        }
        const idoByUser = idoPoolData.getUserIDO;
        if (depositInfo.claimStatus === 'enable') {
            if (new bignumber_js_1.default(depositInfo.avgPrice).comparedTo('0') > 0) {
                const insuranceDetails = await multiCall.call(idoByUser.insuranceIds.map((it) => {
                    return {
                        getInsuranceDetail: insurancePool.mulContract.getInsuranceDetail(it),
                    };
                }));
                const handleInsuranceDetails = (depositData, insuranceDetail, insuranceId) => {
                    const result = insuranceDetail.getInsuranceDetail;
                    const payAmount = new bignumber_js_1.default(result.buyQuota.toString()).div(sellingTokenDiv).multipliedBy(new bignumber_js_1.default(result.price.toString()).div(raisingTokenDiv).minus(depositInfo.avgPrice)).toFixed();
                    depositData.insuranceId = new bignumber_js_1.default(insuranceId).toFixed();
                    if (new bignumber_js_1.default(payAmount).comparedTo('0') <= 0) {
                        depositData.payCompensationState = 'noClaim';
                    }
                    else {
                        depositData.payCompensation = payAmount;
                        depositData.payCompensationState = result.lossClaimed ? 'received' : 'claim';
                    }
                };
                if (depositInfo.whiteList.insurance && depositInfo.publicSale.insurance) {
                    handleInsuranceDetails(depositInfo.whiteList, insuranceDetails[0], idoByUser.insuranceIds[0]);
                    handleInsuranceDetails(depositInfo.publicSale, insuranceDetails[1], idoByUser.insuranceIds[1]);
                }
                else if (depositInfo.whiteList.insurance) {
                    handleInsuranceDetails(depositInfo.whiteList, insuranceDetails[0], idoByUser.insuranceIds[0]);
                }
                else if (depositInfo.publicSale.insurance) {
                    handleInsuranceDetails(depositInfo.publicSale, insuranceDetails[0], idoByUser.insuranceIds[0]);
                }
            }
            else {
                // 检查是不是wait
                const time = (0, get_1.default)(launchpadInfo, 'redemption_time', '0');
                // 如果未到时间
                let state = 'disabled';
                const payCompensationDate = +time + (60 * 60 * 24 * 7);
                if (new bignumber_js_1.default(time).comparedTo('0') > 0)
                    state = 'wait';
                // 如果没有时间
                if (depositInfo.whiteList.insurance) {
                    depositInfo.whiteList.payCompensationState = state;
                    depositInfo.whiteList.payCompensationDate = payCompensationDate;
                }
                if (depositInfo.publicSale.insurance) {
                    depositInfo.publicSale.payCompensationState = state;
                    depositInfo.publicSale.payCompensationDate = payCompensationDate;
                }
            }
        }
        const raisingTokenPrice = await this.getTokenPrice(poolInfo.raisingTokenInfo.id);
        const poolDetail = new vo_1.IDOPoolDetail();
        poolDetail.tier = depositInfo.userTier;
        poolDetail.depositInfo = depositInfo;
        poolDetail.pool = poolInfo;
        poolDetail.insurance = insurancePoolData.isRegisteredPool;
        // 当前用户额度
        poolDetail.whitelistSaleQuota = new bignumber_js_1.default(idoPoolData.getPresaleQuota.toString()).dividedBy(sellingTokenDiv).toFixed();
        // 白名单额度
        poolDetail.whitelistAllocationTokenAmount = poolInfo.whiteListQuota;
        // 总出售 - 白名单额度
        poolDetail.publicAllocation = bignumber_js_1.default.max(new bignumber_js_1.default((0, get_1.default)(launchpadInfo, 'pool_size', '0')).minus(poolInfo.whiteListQuota), '0').toFixed();
        poolDetail.launchpadTotalRaise = new bignumber_js_1.default(idoPoolData.totalRaised.toString()).dividedBy(raisingTokenDiv).multipliedBy(raisingTokenPrice).toFixed();
        poolDetail.tokenTotalSupply = new bignumber_js_1.default(idoPoolData.totalSupply.toString()).dividedBy(sellingTokenDiv).toFixed();
        if (launchpadInfo) {
            poolDetail.poolSize = (0, get_1.default)(launchpadInfo, 'pool_size', '');
            poolDetail.initialMarketCap = (0, get_1.default)(launchpadInfo, 'initial_market_cap', '');
            poolDetail.FDV = (0, get_1.default)(launchpadInfo, 'fdv', '');
            poolDetail.tags = (0, get_1.default)(launchpadInfo, 'selling_token_tag', '');
            poolDetail.whitelistStakingTierRequired = (0, get_1.default)(launchpadInfo, 'whitelist_staking_tier_required', '');
            poolDetail.whitelistRegistrationRequired = (0, get_1.default)(launchpadInfo, 'whitelist_registration_required', '');
            poolDetail.whitelistDistribution = (0, get_1.default)(launchpadInfo, 'whitelist_distribution', '');
            poolDetail.publicStakingTierRequired = (0, get_1.default)(launchpadInfo, 'public_registration_required', '');
            poolDetail.publicRegistrationRequired = (0, get_1.default)(launchpadInfo, 'public_registration_required', '');
            poolDetail.publicDistribution = (0, get_1.default)(launchpadInfo, 'public_distribution', '');
            poolDetail.introduction = (0, get_1.default)(launchpadInfo, 'introduction', '');
            poolDetail.shares = (0, get_1.default)(launchpadInfo, 'shares', []).filter(it => it.icon);
        }
        else {
            poolDetail.poolSize = '';
            poolDetail.initialMarketCap = '';
            poolDetail.FDV = '';
            poolDetail.whitelistStakingTierRequired = 'No';
            poolDetail.whitelistRegistrationRequired = 'No';
            poolDetail.whitelistDistribution = '';
            poolDetail.publicStakingTierRequired = 'Yes';
            poolDetail.publicRegistrationRequired = 'Yes';
            poolDetail.publicDistribution = '';
            poolDetail.introduction = '';
            poolDetail.shares = [];
        }
        return poolDetail;
    }
};
exports.LaunchpadApi = LaunchpadApi;
exports.LaunchpadApi = LaunchpadApi = __decorate([
    (0, tool_1.CacheKey)('LaunchpadApi')
], LaunchpadApi);
