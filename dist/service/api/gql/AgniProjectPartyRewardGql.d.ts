import { ProjectPartyRewardClaim } from "../../vo";
export declare const AgniProjectPartyQueryPairGQL: string;
export type AgniProjectPartyQueryPairGQLResult = {
    result: {
        id: string;
        token0: {
            symbol: string;
        };
        token1: {
            symbol: string;
        };
        feeTier: string;
    }[];
};
export declare const AgniProjectPartyClaimLogsGQL: string;
export type AgniProjectPartyClaimLogsGQLResult = {
    claimLogs: ProjectPartyRewardClaim[];
};
