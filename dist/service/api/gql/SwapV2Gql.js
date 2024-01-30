"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapV2QueryV2PoolsGQL = void 0;
const graphql_request_1 = require("graphql-request");
exports.SwapV2QueryV2PoolsGQL = (0, graphql_request_1.gql) `
  query getPools($pageSize: Int!, $poolAddrs: [ID!]) {
    pairs(first: $pageSize, where: { id_in: $poolAddrs }) {
      id
      reserve0
      reserve1
      reserveUSD
    }
  }
`;
