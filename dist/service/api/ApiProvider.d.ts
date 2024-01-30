import { PoolV3Api } from './PoolV3Api';
import { SwapApi } from './SwapApi';
import { TokenMangerApi } from './TokenMangerApi';
import type { BaseApi } from './BaseApi';
import type { TransactionHistory } from './TransactionHistory';
import { LaunchpadApi } from './LaunchpadApi';
import { DashboardApi } from './DashboardApi';
import { AgniProjectPartyRewardApi } from './AgniProjectPartyRewardApi';
import { SApiProvider } from "./SApiProvider";
/**
 * 请求基类 详细信息查看
 */
declare class ApiProvider {
    baseApi: BaseApi;
    constructor();
    poolV3Api(): PoolV3Api;
    swapV3Api(): SwapApi;
    projectPartyRewardApi(): AgniProjectPartyRewardApi;
    tokenMangerApi(): TokenMangerApi;
    dashboard(): DashboardApi;
    SApiProvider(): SApiProvider;
    transactionHistory(): TransactionHistory;
    launchpad(): LaunchpadApi;
}
export { ApiProvider };
