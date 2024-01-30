import type { TransactionEvent } from '../TransactionEvent';
import type { BalanceAndAllowance } from '../Types';
import type { ConnectInfo } from '../../../ConnectInfo';
import type { Token } from '../../tool';
export interface LaunchpadStakeInfo {
    id: string;
    user: string;
    token: string;
    tokenIdOrAmount: string;
    unlockTime: string;
    score: string;
    unStaked: boolean;
}
export declare class LaunchpadStakeDetail {
    token: Token;
    balance: BalanceAndAllowance;
    minInputAmount: string;
    unStakeAmount: string;
    lockAmount: string;
    userTier: number;
    stake: (connect: ConnectInfo, amount: string) => Promise<TransactionEvent>;
    unStake: (connect: ConnectInfo) => Promise<TransactionEvent>;
}
export declare class IdoPoolStatistic {
    /**
     * 总参与人数
     */
    totalParticipants: string;
    /**
     * 总募资项目数
     */
    fundedProjects: string;
    /**
     *  总募资金额 USD
     */
    raisedCapital: string;
}
export declare class IDOPool {
    /**
     * 池子ID
     */
    id: string;
    /**
     * 募资金额
     */
    raisingAmount: string;
    expectedRaisingAmount: string;
    /**
     * 募资代币的价格
     */
    raisingTokenPrice: string;
    /**
     * 募资代币的历史最高价格
     */
    raisingTokenATHPrice: string;
    /**
     * 出售代币的历史最高价格
     */
    sellingTokenATHPrice: string;
    /**
     * 预售价格
     */
    publicSalePrice: string;
    /**
     * 白名单价格
     */
    presalePrice: string;
    /**
     * 募资代币
     */
    raisingTokenInfo: IDOToken;
    raisingTokenLogo: string;
    /**
     * 出售代币
     */
    sellingTokenInfo: IDOToken;
    sellingTokenLogo: string;
    /**
     * ROI
     */
    roi: string;
    /**
     * 募资开始时间 (秒)
     */
    presaleAndEnrollStartTime: number;
    publicSaleDepositEndTime: number;
    soldOut: boolean;
}
export interface IdoPoolInfos {
    idoPoolStatistics: IdoPoolStatistic;
    allProject: IDOPool[];
    ended: IDOPool[];
    upcomingProjects: IDOPool[];
    comingProjects: IDOPool[];
}
export declare class IDOPoolInfo {
    id: string;
    timestamp: string;
    fundraiser: string;
    raisingToken: string;
    raisingTokenInfo: IDOToken;
    raisingTokenLogo: string;
    sellingTokenLogo: string;
    sellingTokenInfo: IDOToken;
    totalSupply: string;
    presalePrice: string;
    publicSalePrice: string;
    presaleAndEnrollStartTime: string;
    presaleAndEnrollEndTime: string;
    presaleAndEnrollPeriod: string;
    publicSaleDepositStartTime: string;
    publicSaleDepositEndTime: string;
    publicSaleDepositPeriod: string;
    claimStartTime: string;
    unlockTillTime: string;
    lockPeriod: string;
    tgeUnlockRatio: string;
    insuranceFeeRate: string;
    platformCommissionFeeRate: string;
    enrollCount: string;
    whiteListQuota: string;
    whiteListCount: string;
    publicQuota: string;
    publicCount: string;
    totalRaised: string;
    totalExtraDeposit: string;
}
export declare class ShareInfo {
    id: number;
    type: string;
    url: string;
}
export interface IDOToken {
    id: string;
    name: string;
    symbol: string;
    decimals: string;
}
export declare class IDODepositInfo {
    timeState: 'Deposit' | 'Claiming' | 'Finished';
    claimStatus: 'enable' | 'disabled';
    insurance: boolean;
    claimableAmount: string;
    extraDepositRefund: string;
    totalExtraDeposit: string;
    whiteList: {
        type: 'publicSale' | 'whiteList';
        canDeposit: boolean;
        deposited: boolean;
        quota: string;
        raising: string;
        price: string;
        depositAmount: string;
        maxDepositAmount: string;
        insurance: boolean;
        countdownEndTime: number;
        depositStatus: 'enable' | 'disabled';
        payCompensation: string;
        payCompensationState: 'hidden' | 'disabled' | 'wait' | 'claim' | 'received' | 'noClaim';
        payCompensationDate: number;
        insuranceId: string;
    };
    publicSale: {
        type: 'publicSale' | 'whiteList';
        canDeposit: boolean;
        deposited: boolean;
        quota: string;
        raising: string;
        price: string;
        depositAmount: string;
        maxDepositAmount: string;
        extraDepositAmount: string;
        insurance: boolean;
        countdownEndTime: number;
        depositStatus: 'enable' | 'disabled';
        payCompensation: string;
        payCompensationState: 'hidden' | 'disabled' | 'wait' | 'claim' | 'received' | 'noClaim';
        payCompensationDate: number;
        insuranceId: string;
    };
    currentDeposit: {
        type: 'publicSale' | 'whiteList';
        canDeposit: boolean;
        deposited: boolean;
        quota: string;
        raising: string;
        price: string;
    };
    totalSupply: string;
    avgPrice: string;
    needToPay: string;
    maxRaisingAmount: string;
    totalRaised: string;
    insuranceFeeRate: string;
    raisingBalance: BalanceAndAllowance;
    canEnroll: boolean;
    checkUserTier: boolean;
    userTier: number;
    needUserTier: number;
    isEnroll: boolean;
    totalBuyByUsers: string;
    maxExtraDeposit: string;
    triggerExtraDeposit: string;
    depositMaxInput: string;
    claimLoss: (connect: ConnectInfo, insuranceId: string) => Promise<TransactionEvent>;
    enroll: (connect: ConnectInfo) => Promise<TransactionEvent>;
    claim: (connect: ConnectInfo) => Promise<TransactionEvent>;
    deposit: (connect: ConnectInfo, buyInsurance: boolean, depositAmount: string, extraDeposit: string) => Promise<TransactionEvent>;
    calculateInsuranceFee: (depositAmount: string) => string;
    calculateQuote: (depositAmount: string) => string;
}
export declare class IDOUserDepositInfo {
    publicSaleQuota: string;
    presaleQuote: string;
    extraDeposit: string;
    refund: string;
    publicSaleBuyInsurance: boolean;
    presaleBuyInsurance: boolean;
}
export declare class IDOPoolDetail {
    updateId: number;
    pool: IDOPoolInfo;
    depositInfo: IDODepositInfo;
    shares: ShareInfo[];
    insurance: boolean;
    tier: number;
    whitelistSaleQuota: string;
    whitelistAllocationTokenAmount: string;
    whitelistDistribution: string;
    whitelistStakingTierRequired: string;
    whitelistRegistrationRequired: string;
    publicAllocation: string;
    publicDistribution: string;
    publicStakingTierRequired: string;
    publicRegistrationRequired: string;
    introduction: string;
    tokenTotalSupply: string;
    launchpadTotalRaise: string;
    poolSize: string;
    initialMarketCap: string;
    FDV: string;
    tags: string;
}
export interface LaunchpadInfo {
    lanchpad_id: string;
    fundraiser: string;
    raising_token: string;
    raising_token_decimal: number;
    raising_token_icon: string;
    selling_token: string;
    selling_token_decimal: number;
    selling_token_icon: string;
    selling_token_tag: string;
    total_raise: string;
    total_supply: string;
    presale_price: string;
    presale_raise: string;
    public_sale_price: string;
    public_sale_raise: string;
    presale_and_enroll_start_time: number;
    presale_and_enroll_period: number;
    presale_and_enroll_end_time: number;
    public_sale_deposit_start_time: number;
    public_sale_deposit_period: number;
    public_sale_deposit_end_time: number;
    claim_start_time: number;
    lock_period: number;
    tge_unlock_ratio: string;
    ido_pool_contract: string;
    pool_size: string;
    initial_market_cap: string;
    fdv: string;
    whitelist_staking_tier_required: string;
    whitelist_registration_required: string;
    whitelist_distribution: string;
    public_staking_tier_required: string;
    public_registration_required: string;
    public_distribution: string;
    redemption_time: string;
    shares: ShareInfo[];
    introduction: string;
}
export interface TieInfo {
    'address': string;
    'score': number;
    'tie': number;
}
