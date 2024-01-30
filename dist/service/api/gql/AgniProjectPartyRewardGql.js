"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgniProjectPartyClaimLogsGQL = exports.AgniProjectPartyQueryPairGQL = void 0;
const graphql_request_1 = require("graphql-request");
exports.AgniProjectPartyQueryPairGQL = (0, graphql_request_1.gql) `
  query b($ids:[String]) {
    result: pools(where:{id_in: $ids}){
      id
      token0{
        symbol
      }
      token1{
        symbol
      }
      feeTier

    }
  }`;
exports.AgniProjectPartyClaimLogsGQL = (0, graphql_request_1.gql) `query b($user: String) {
          claimLogs(where: {user: $user}) {
            id
            timestamp
            hash
            epoch
            amount
            user
          }
        }`;
