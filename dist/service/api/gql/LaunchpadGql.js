"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIDOPoolInfo = exports.QueryIDOUserDepositedLogsByPool = exports.QueryTokenATHPriceHistory = exports.QueryIdoPoolInfosGQL = exports.UserStakeInfosGQL = void 0;
const graphql_request_1 = require("graphql-request");
exports.UserStakeInfosGQL = (0, graphql_request_1.gql) `
  query stakeInfos($token:String!,$user:String!) {
    stakeInfos(where:{unStaked:false user:$user token:$token}){
      id
      user
      token
      tokenIdOrAmount
      unlockTime
      score
      unStaked

    }
  }
`;
exports.QueryIdoPoolInfosGQL = (0, graphql_request_1.gql) `
  query poolInfos {
    idoPoolStatistics(id: "idoPoolStatistics") {
      totalParticipants
      fundedProjects
    }
    idoPools(orderBy: block, orderDirection: desc) {
      id
      timestamp
      fundraiser
      raisingToken
      raisingTokenInfo {
        id
        name
        symbol
        decimals
      }
      sellingToken
      sellingTokenInfo {
        id
        name
        symbol
        decimals
      }
      totalSupply
      presalePrice
      publicSalePrice
      presaleAndEnrollStartTime
      presaleAndEnrollEndTime
      presaleAndEnrollPeriod
      publicSaleDepositStartTime
      publicSaleDepositEndTime
      publicSaleDepositPeriod
      claimStartTime
      unlockTillTime
      lockPeriod
      tgeUnlockRatio
      insuranceFeeRate
      platformCommissionFeeRate
      enrollCount
      totalBuy
      totalRaised
      totalExtraDeposit
      whiteListQuota
      whiteListCount
      publicQuota
      publicCount
    }
  }
`;
exports.QueryTokenATHPriceHistory = (0, graphql_request_1.gql) `
  query tokenDayDatas($token:String!) {
    tokenDayDatas(
      orderBy: date
      orderDirection: desc
      first: 1000
      where: {token: $token}
    ) {
      date
      priceUSD
      high
    }
  }
`;
exports.QueryIDOUserDepositedLogsByPool = (0, graphql_request_1.gql) `
  query userDepositedLogs($user:String!,$pool:String!) {
    idoPoolClaimedLogs(where:{user:$user pool:$pool refund_gt:0}){
      refund
    }
    idoPoolPresaleDepositedLogs(where:{user:$user pool:$pool}){
      buyQuota
      buyInsurance
    }
    idoPoolPublicSaleDepositedLogs(where:{user:$user pool:$pool}){
      buyInsurance
      buyQuota
      extraDeposit
    }
  }
`;
exports.QueryIDOPoolInfo = (0, graphql_request_1.gql) `query poolInfo($id:String!) {
  idoPool(id:$id) {
    id
    timestamp
    fundraiser
    raisingToken
    raisingTokenInfo {
      id
      name
      symbol
      decimals
    }
    sellingToken
    sellingTokenInfo {
      id
      name
      symbol
      decimals
    }
    totalSupply
    presalePrice
    publicSalePrice
    presaleAndEnrollStartTime
    presaleAndEnrollEndTime
    presaleAndEnrollPeriod
    publicSaleDepositStartTime
    publicSaleDepositEndTime
    publicSaleDepositPeriod
    claimStartTime
    unlockTillTime
    lockPeriod
    tgeUnlockRatio
    insuranceFeeRate
    platformCommissionFeeRate
    enrollCount
    whiteListQuota
    whiteListCount
    publicQuota
    publicCount
    totalRaised
  }
}`;
