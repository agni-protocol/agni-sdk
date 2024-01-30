"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionHistoryGQL = exports.FeeTierDistributionGQL = exports.AllV3TicksGQL = exports.TokenPriceGQL = void 0;
const graphql_request_1 = require("graphql-request");
exports.TokenPriceGQL = (0, graphql_request_1.gql) `
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

`;
exports.AllV3TicksGQL = (0, graphql_request_1.gql) `
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
`;
exports.FeeTierDistributionGQL = (0, graphql_request_1.gql) `
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
`;
exports.PositionHistoryGQL = (0, graphql_request_1.gql) `
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
`;
