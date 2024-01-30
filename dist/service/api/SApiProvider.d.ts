import type { DashboardChartDayData, DashboardPoolData, DashboardProtocolData, DashboardTokenData, DashboardTransaction } from "../vo";
interface Result<T> {
    error: boolean;
    data: T | undefined;
}
export declare class SApiProvider {
    tryRequest<T = any>(path: string, method: 'get' | 'post' | 'put' | 'delete', data: any, config?: any): Promise<Result<T>>;
    protocolData(): Promise<Result<DashboardProtocolData>>;
    chartData(): Promise<Result<DashboardChartDayData[]>>;
    topPool(): Promise<Result<Record<string, DashboardPoolData>>>;
    topToken(): Promise<Result<Record<string, DashboardTokenData>>>;
    topTransactions(): Promise<Result<DashboardTransaction[]>>;
}
export {};
