"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTokenPriceDataGQL = exports.globalTransactionsGQL = exports.globalChartGQL = exports.globalDataGQL = exports.topTokensGQL = exports.topPoolsGQL = exports.ethPricesGQL = exports.tokensBulkGQL = exports.poolsBulkGQL = exports.QueryBlockMeta = exports.QueryBlockTimeGQL = void 0;
const graphql_request_1 = require("graphql-request");
function QueryBlockTimeGQL(timestamps) {
    return (0, graphql_request_1.gql) `query blocks {
    ${timestamps.map((timestamp) => {
        return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp + 600} }) {
              number
            }`;
    })}
  }`;
}
exports.QueryBlockTimeGQL = QueryBlockTimeGQL;
function QueryBlockMeta() {
    return (0, graphql_request_1.gql) `query blocks {
    _meta {
      block {
        number
        hash
        timestamp
      }

    }
  }`;
}
exports.QueryBlockMeta = QueryBlockMeta;
function poolsBulkGQL(block, pools) {
    let poolString = `[`;
    pools.forEach((address) => {
        poolString = `${poolString}"${address}",`;
    });
    poolString += ']';
    const queryString = `
    query pools {
      pools(where: {id_in: ${poolString}},
     ${block ? `block: {number: ${(block)}} ,` : ``}
     ) {
        id
        feeTier
        liquidity
        sqrtPrice
        tick
        token0 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        token1 {
            id
            symbol
            name
            decimals
            derivedETH
        }
        token0Price
        token1Price
        volumeUSD
        volumeToken0
        volumeToken1
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
        feesUSD
        protocolFeesUSD
      }
      bundles(where: {id: "1"}) {
        ethPriceUSD
      }
    }
    `;
    return (0, graphql_request_1.gql) `
    ${queryString}
  `;
}
exports.poolsBulkGQL = poolsBulkGQL;
function tokensBulkGQL(block, tokens) {
    let tokenString = `[`;
    tokens.forEach((address) => {
        tokenString = `${tokenString}"${address}",`;
    });
    tokenString += ']';
    const queryString = `
    query tokens {
      tokens(where: {id_in: ${tokenString}},
    ${block
        ? `block: {number: ${(block)}} ,`
        : ''}
     ) {
        id
        symbol
        name
        derivedETH
        derivedUSD
        volumeUSD
        volume
        txCount
        totalValueLocked
        feesUSD
        totalValueLockedUSD
        derivedUSD
      }
    }
    `;
    return (0, graphql_request_1.gql) `
    ${queryString}
  `;
}
exports.tokensBulkGQL = tokensBulkGQL;
function ethPricesGQL(block24, block48, blockWeek) {
    const dayQueryString = block24
        ? `oneDay: bundles(first: 1, block: { number: ${(block24)} }) {
      ethPriceUSD
    }`
        : '';
    const twoDayQueryString = block48
        ? `twoDay: bundles(first: 1, block: { number: ${(block48)} }) {
      ethPriceUSD
    }`
        : '';
    const weekQueryString = blockWeek
        ? `oneWeek: bundles(first: 1, block: { number: ${(blockWeek)} }) {
      ethPriceUSD
    }`
        : '';
    const queryString = `
  query prices {
    current: bundles(first: 1) {
      ethPriceUSD
    }
    ${dayQueryString}
    ${twoDayQueryString}
    ${weekQueryString}
  }
`;
    return (0, graphql_request_1.gql) `
    ${queryString}
  `;
}
exports.ethPricesGQL = ethPricesGQL;
exports.topPoolsGQL = (0, graphql_request_1.gql) `
  query topPools {
    pools(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
    }
  }
`;
exports.topTokensGQL = (0, graphql_request_1.gql) `
  query topPools {
    tokens(first: 1000,where:{totalValueLockedUSD_gt:0 } ) {
      id
      totalValueLockedUSD
    }
  }
`;
function globalDataGQL(block) {
    const queryString = ` query magmaFactories {
      factories(
       ${block ? `block: { number: ${block}}` : ``}
       first: 1) {
        txCount
        totalVolumeUSD
        totalFeesUSD
        totalValueLockedUSD
        totalProtocolFeesUSD
      }
    }`;
    return (0, graphql_request_1.gql) `
    ${queryString}
  `;
}
exports.globalDataGQL = globalDataGQL;
exports.globalChartGQL = (0, graphql_request_1.gql) `
  query pancakeDayDatas($startTime: Int!, $skip: Int!) {
    pancakeDayDatas(first: 1000, skip: $skip, where: { date_gt: $startTime }, orderBy: date, orderDirection: asc) {
      id
      date
      volumeUSD
      tvlUSD
    }
  }
`;
exports.globalTransactionsGQL = (0, graphql_request_1.gql) `
  query transactions {
    mints(first: 500, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
      owner
      sender
      origin
      amount0
      amount1
      amountUSD
    }
    swaps(first: 500, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
      origin
      amount0
      amount1
      amountUSD
    }
    burns(first: 500, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
      owner
      origin
      amount0
      amount1
      amountUSD
    }
  }
`;
function GetTokenPriceDataGQL(hour, token) {
    const queryString = `
    query b {
      datas: ${hour ? 'tokenHourDatas' : 'tokenDayDatas'}(
        orderBy: ${hour ? 'periodStartUnix' : 'date'}
        orderDirection: desc
        skip: 0
        first: 500
        where:{
            token:"${token.toLowerCase()}"
        }
      ) {
        time:${hour ? 'periodStartUnix' : 'date'}
        priceUSD
      }
    }`;
    return (0, graphql_request_1.gql) `${queryString}`;
}
exports.GetTokenPriceDataGQL = GetTokenPriceDataGQL;
