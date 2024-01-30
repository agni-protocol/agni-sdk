import {CacheKey, createProxy, mixProxy} from '../tool'
import { PoolV3Api } from './PoolV3Api'
import { SwapApi } from './SwapApi'
import { TokenMangerApi } from './TokenMangerApi'
import type { BaseApi } from './BaseApi'
import { BASE_API } from './BaseApi'
import type { TransactionHistory } from './TransactionHistory'
import { transactionHistory } from './TransactionHistory'
import { LaunchpadApi } from './LaunchpadApi'
import { DashboardApi } from './DashboardApi'
import { AgniProjectPartyRewardApi } from './AgniProjectPartyRewardApi'
import {SApiProvider} from "./SApiProvider";

/**
 * 请求基类 详细信息查看
 */
@CacheKey('ApiProvider')
class ApiProvider {
  public baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  poolV3Api(): PoolV3Api {
    return mixProxy(PoolV3Api)
  }

  swapV3Api(): SwapApi {
    return mixProxy(SwapApi)
  }

  projectPartyRewardApi(): AgniProjectPartyRewardApi {
    return mixProxy(AgniProjectPartyRewardApi)
  }

  tokenMangerApi(): TokenMangerApi {
    return mixProxy(TokenMangerApi)
  }

  dashboard(): DashboardApi {
    return mixProxy(DashboardApi)
  }

  SApiProvider(): SApiProvider {
    return mixProxy(SApiProvider)
  }

  transactionHistory(): TransactionHistory {
    return transactionHistory
  }

  launchpad(): LaunchpadApi {
    return mixProxy(LaunchpadApi)
  }
}

export { ApiProvider }
