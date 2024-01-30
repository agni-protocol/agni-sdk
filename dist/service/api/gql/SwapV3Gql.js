"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDerivedPricesGQL = exports.SwapQueryV3Pools = void 0;
const graphql_request_1 = require("graphql-request");
exports.SwapQueryV3Pools = (0, graphql_request_1.gql) `
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
`;
function GetDerivedPricesGQL(tokenAddress, blocks) {
    const subqueries = blocks.filter(it => it.number).map(block => `
    t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number}}) {
        derivedUSD
      }
    `);
    return (0, graphql_request_1.gql) `
      query getToken {
          ${subqueries}
      }
  `;
}
exports.GetDerivedPricesGQL = GetDerivedPricesGQL;
