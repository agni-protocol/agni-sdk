import type { Block, DashboardChartDayData, DashboardPoolData, DashboardProtocolData, DashboardTokenData, DashboardTransaction } from '../vo';
export declare class DashboardApi {
    private baseApi;
    constructor();
    getBlocksFromTimestamps(timestamps: number[], type?: 'exchange-v3'): Promise<Block[]>;
    protocolData(): Promise<DashboardProtocolData>;
    chartData(): Promise<DashboardChartDayData[]>;
    topPool(): Promise<Record<string, DashboardPoolData>>;
    ethPriceDatas(): Promise<{
        current: number;
        oneDay: number;
        twoDay: number;
        week: number;
    }>;
    topToken(): Promise<Record<string, DashboardTokenData>>;
    private poolDatas;
    topTransactions(): Promise<DashboardTransaction[]>;
}
