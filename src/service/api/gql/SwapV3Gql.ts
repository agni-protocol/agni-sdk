import { gql } from 'graphql-request'
import type { Block } from '../../vo'

export interface SwapQueryV3PoolsResult {
  pools: {
    id: string
    tick: number
    sqrtPrice: string
    feeTier: number
    liquidity: string
    feeProtocol: string
    totalValueLockedUSD: string
  }[]
}

export const SwapQueryV3Pools = gql`
    query getPools($pageSize: Int!, $poolAddrs: [String]) {
        pools(first: $pageSize, where: { id_in: $poolAddrs }) {
            id
            tick
            sqrtPrice
            feeTier
            liquidity
            feeProtocol
            totalValueLockedUSD
        }
    }
`
export function GetDerivedPricesGQL(tokenAddress: string, blocks: Block[]) {
  const subqueries = blocks.filter(it => it.number).map(
    block => `
    t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number}}) {
        derivedUSD
      }
    `,
  )
  return gql`
      query getToken {
          ${subqueries}
      }
  `
}

export interface GetDerivedPricesGQLResult {
  [key: string]: {
    derivedUSD: string
  }
}
