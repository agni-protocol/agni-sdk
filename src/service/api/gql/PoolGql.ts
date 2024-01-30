import {gql} from "graphql-request";

export const TokenPriceGQL = gql`
  query b ($addresses:[String]) {
    bundles {
      ethPriceUSD
    }
    tokens(
      where: {id_in: $addresses}
    ) {
      id
      derivedETH
    }
  }

`
export const AllV3TicksGQL = gql`
  query AllV3Ticks($poolAddress: String!, $lastTick: Int!, $pageSize: Int!) {
    ticks(
      first: $pageSize,
      where: {
        poolAddress: $poolAddress,
        tickIdx_gt: $lastTick,
      },
      orderBy: tickIdx
    ) {
      tick: tickIdx
      liquidityNet
      liquidityGross
    }
  }
`

export const FeeTierDistributionGQL = gql`
  query FeeTierDistribution($token0: String!, $token1: String!) {
    _meta {
      block {
        number
      }
    }
    asToken0: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token0, token1: $token1 }
    ) {
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
    asToken1: pools(
      orderBy: totalValueLockedToken0
      orderDirection: desc
      where: { token0: $token1, token1: $token0 }
    ) {
      feeTier
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`

export const PositionHistoryGQL = gql`
  query positionHistory($tokenId: String!) {
    positionSnapshots(where: { position: $tokenId }, orderBy: timestamp, orderDirection: desc, first: 30) {
      id
      transaction {
        mints(where: { or: [{ amount0_gt: "0" }, { amount1_gt: "0" }] }) {
          id
          timestamp
          amount1
          amount0
          logIndex
        }
        burns(where: { or: [{ amount0_gt: "0" }, { amount1_gt: "0" }] }) {
          id
          timestamp
          amount1
          amount0
          logIndex
        }
        collects(where: { or: [{ amount0_gt: "0" }, { amount1_gt: "0" }] }) {
          id
          timestamp
          amount0
          amount1
          logIndex
        }
      }
    }
  }
`
