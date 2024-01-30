/**
 * 轮询休眠时长 ms
 */
export declare const SLEEP_MS: number;
/**
 * 0 地址
 */
export declare const ZERO_ADDRESS: string;
export declare const INVALID_ADDRESS: string;
export declare const ONE_ADDRESS: string;
export declare const ADDRESS_THIS = "0x0000000000000000000000000000000000000002";
/**
 * uint(-1)
 */
export declare const MAXIMUM_U256: string;
/**
 *  b / 1e18
 * @param bnAmount
 * @param precision
 */
export declare function convertBigNumber(bnAmount: string | number, precision?: number): string;
/**
 *  b / (10 ** decimals)
 * @param bnAmount
 * @param decimals
 */
export declare function convertBigNumber1(bnAmount: string | number, decimals?: string | number): string;
/**
 * b * 1e18
 * @param bnAmount
 * @param precision
 */
export declare function convertAmount(bnAmount: string | number, precision?: number): string;
/**
 * amount * (10 ** decimals)
 * @param amount
 * @param decimals
 */
export declare function convertAmount1(amount: string | number, decimals?: number): string;
/**
 * 休眠指定时间
 * @param ms
 */
export declare function sleep(ms: number): Promise<unknown>;
/**
 * 判断未空字符串
 * @param value
 */
export declare function isNullOrBlank(value: string): boolean;
/**
 * 判断Null Or Undefined
 * @param value
 */
export declare function isNullOrUndefined(value: any): boolean;
/**
 * 重试
 * @param func
 * @param retryCount
 */
export declare function retry(func: () => any, retryCount?: number): Promise<any>;
export declare function calculateGasMargin(value: string): number;
export declare function eqAddress(addr0: string, addr1: string): boolean;
export declare function showApprove(balanceInfo: {
    allowance: string | number;
    decimals: string | number;
}): boolean;
export declare function getValue(obj: any, path: string, defaultValue: any): any;
export declare function isNumber(input: string): boolean;
/**
 * 日志工具
 */
export declare class TraceTool {
    private logShow;
    private errorShow;
    private debugShow;
    setLogShow(b: boolean): void;
    setErrorShow(b: boolean): void;
    setDebugShow(b: boolean): void;
    log(...args: any): void;
    print(...args: any): void;
    error(...args: any): void;
    debug(...args: any): void;
}
export declare const Trace: TraceTool;
