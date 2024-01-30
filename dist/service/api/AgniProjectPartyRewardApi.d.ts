import { ProjectPartyRewardResult } from '../vo';
import type { BaseApi } from './BaseApi';
export declare class AgniProjectPartyRewardApi {
    baseApi: BaseApi;
    constructor();
    private projectPartyReward;
    private userLPTokenIds;
    result(account: string): Promise<ProjectPartyRewardResult>;
}
