import {BASE_API} from "./BaseApi";
import {CacheKey} from "../tool";
import {Transaction} from "ethers";
import type {
  DashboardChartDayData,
  DashboardPoolData,
  DashboardProtocolData,
  DashboardTokenData,
  DashboardTransaction
} from "../vo";

interface Result<T> {
  error: boolean
  data: T | undefined
}


@CacheKey('SApiProvider')
export class SApiProvider {
  async tryRequest<T = any>(
    path: string,
    method: 'get' | 'post' | 'put' | 'delete',
    data: any,
    config: any = {
      headers: {},
    },
  ): Promise<Result<T>> {
    try {
      const addressInfo = BASE_API.connectInfo().addressInfo;

      const result = await BASE_API.request(addressInfo.baseApiUrl + "/s_api" + path, method, data, config)
      return {
        error: false,
        data: result.data
      }
    } catch (e) {
      return {
        error: true,
        data: undefined
      }
    }
  }

  async protocolData(): Promise<Result<DashboardProtocolData>> {
    return this.tryRequest<DashboardProtocolData>('/protocolData', 'get', {})
  }

  async chartData(): Promise<Result<DashboardChartDayData[]>> {
    return this.tryRequest<DashboardChartDayData[]>('/chartData', 'get', {});
  }

  async topPool(): Promise<Result<Record<string, DashboardPoolData>>> {
    return this.tryRequest<Record<string, DashboardPoolData>>('/topPool', 'get', {})
  }

  async topToken(): Promise<Result<Record<string, DashboardTokenData>>> {
    return this.tryRequest<Record<string, DashboardTokenData>>('/topToken', 'get', {})
  }

  async topTransactions(): Promise<Result<DashboardTransaction[]>> {
    return this.tryRequest<DashboardTransaction[]>('/topTransactions', 'get', {})
  }


}
