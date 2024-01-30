export declare class PriceLine {
    time: number;
    priceUSD: string;
}
export declare function generatePriceLine(timeInterval: number, endTime: number, size: number, contain: boolean, klineList: PriceLine[]): PriceLine[];
/**
 * K线聚合
 * @param priceLines
 */
export declare function aggregateData(priceLines: PriceLine[]): PriceLine;
