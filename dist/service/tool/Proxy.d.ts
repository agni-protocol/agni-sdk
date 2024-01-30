import { ConnectInfo } from "../../ConnectInfo";
export declare class ErrorInfo {
    error: Error;
    msg: string;
    method: string;
    args: any;
    target: any;
}
/**
 * 注册 交易异常处理回调
 * @param errorHandler
 */
export declare function registerTransactionErrorHandler(errorHandler: (error: ErrorInfo) => void): void;
/**
 * 异常处理控制器
 * @param e
 * @param method
 * @param args
 * @param target
 */
export declare function errorHandlerController(e: Error, method: string, args: any, target: any): void;
export type Newable<T extends object> = new (...args: any[]) => T;
export declare function mixProxy<T extends object>(clazz: Newable<T>, ...args: any[]): T;
export declare function mixProxyByConnect<T extends object>(clazz: Newable<T>, connectInfo: ConnectInfo, ...args: any[]): T;
/**
 * 对象代理
 * @param obj
 */
export declare function createProxy<T extends object>(obj: T): T;
