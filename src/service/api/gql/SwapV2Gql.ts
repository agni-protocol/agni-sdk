import { gql } from 'graphql-request'


export const SwapV2QueryV2PoolsGQL = gql`
  query getPools($pageSize: Int!, $poolAddrs: [ID!]) {
    pairs(first: $pageSize, where: { id_in: $poolAddrs }) {
      id
      reserve0
      reserve1
      reserveUSD
    }
  }
`


export interface SwapV2QueryV2PoolsGQLType{
  pairs: {
    id: string
    reserve0: string
    reserve1: string
    reserveUSD: string
  }[]
}
