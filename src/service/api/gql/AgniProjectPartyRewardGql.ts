import {gql} from "graphql-request";
import {ProjectPartyRewardClaim} from "../../vo";


export const AgniProjectPartyQueryPairGQL = gql`
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
  }`

export type AgniProjectPartyQueryPairGQLResult = {

  result: {
    id:string
    token0: {
      symbol: string
    }
    token1: {
      symbol: string
    }
    feeTier: string
  }[]

}


export const AgniProjectPartyClaimLogsGQL = gql`query b($user: String) {
          claimLogs(where: {user: $user}) {
            id
            timestamp
            hash
            epoch
            amount
            user
          }
        }`

export type AgniProjectPartyClaimLogsGQLResult = { claimLogs: ProjectPartyRewardClaim[] }
