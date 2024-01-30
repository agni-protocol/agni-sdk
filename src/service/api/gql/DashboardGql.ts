import {gql} from 'graphql-request'


export function QueryBlockTimeGQL(timestamps: number[]) {
  return gql`query blocks {
    ${timestamps.map((timestamp) => {
              return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
                timestamp + 600
              } }) {
              number
            }`
          })}
  }`
}

export function QueryBlockMeta() {
  return gql`query blocks {
    _meta {
      block {
        number
        hash
        timestamp
      }

    }
  }`
}

export interface QueryBlockMetaVo {
  _meta: {
    block: {
      number: number
      hash: string
      timestamp: number
    }
  }
}


export function poolsBulkGQL(block: number | undefined, pools: string[]) {
  let poolString = `[`
  pools.forEach((address) => {
    poolString = `${poolString}"${address}",`
  })
  poolString += ']'
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
    `
  return gql`
    ${queryString}
  `
}


export function tokensBulkGQL(block: number | undefined, tokens: string[]) {
  let tokenString = `[`
  tokens.forEach((address) => {
    tokenString = `${tokenString}"${address}",`
  })
  tokenString += ']'
  const queryString = `
    query tokens {
      tokens(where: {id_in: ${tokenString}},
    ${
    block
      ? `block: {number: ${(block)}} ,`
      : ''
  }
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
    `
  return gql`
    ${queryString}
  `
}

export function ethPricesGQL(block24?: number, block48?: number, blockWeek?: number) {
  const dayQueryString = block24
    ? `oneDay: bundles(first: 1, block: { number: ${(block24)} }) {
      ethPriceUSD
    }`
    : ''

  const twoDayQueryString = block48
    ? `twoDay: bundles(first: 1, block: { number: ${(block48)} }) {
      ethPriceUSD
    }`
    : ''
  const weekQueryString = blockWeek
    ? `oneWeek: bundles(first: 1, block: { number: ${(blockWeek)} }) {
      ethPriceUSD
    }`
    : ''
  const queryString = `
  query prices {
    current: bundles(first: 1) {
      ethPriceUSD
    }
    ${dayQueryString}
    ${twoDayQueryString}
    ${weekQueryString}
  }
`
  return gql`
    ${queryString}
  `
}


export const topPoolsGQL = gql`
  query topPools {
    pools(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
    }
  }
`


export const topTokensGQL = gql`
  query topPools {
    tokens(first: 1000,where:{totalValueLockedUSD_gt:0 } ) {
      id
      totalValueLockedUSD
    }
  }
`

export interface TopTokensGQLVo {
  tokens: {
    id: string
    totalValueLockedUSD: string
  }[]
}


export function globalDataGQL(block?: string | number) {
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
    }`
  return gql`
    ${queryString}
  `
}

export const globalChartGQL = gql`
  query pancakeDayDatas($startTime: Int!, $skip: Int!) {
    pancakeDayDatas(first: 1000, skip: $skip, where: { date_gt: $startTime }, orderBy: date, orderDirection: asc) {
      id
      date
      volumeUSD
      tvlUSD
    }
  }
`

export const globalTransactionsGQL = gql`
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
`

export function GetTokenPriceDataGQL(hour: boolean, token: string) {
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
    }`
  return gql`${queryString}`
}

export interface GetTokenPriceDataType {
  datas: {
    time: number
    priceUSD: string
  }[]
}

