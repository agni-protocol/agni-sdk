import { Pool, V2Pool, V3Pool } from "../../../vo";
import { Currency, Price } from "../../sdk";
import { Pair } from "../../sdk/v2";
export declare function isV2Pool(pool: Pool): pool is V2Pool;
export declare function isV3Pool(pool: Pool): pool is V3Pool;
export declare function involvesCurrency(pool: Pool, currency: Currency): boolean;
export declare function getOutputCurrency(pool: Pool, currencyIn: Currency): Currency;
export declare const computeV3PoolAddress: ((tokenA: any, tokenB: any, fee: any) => string) & import("lodash").MemoizedFunction;
export declare const computeV2PoolAddress: typeof Pair.getAddress & import("lodash").MemoizedFunction;
export declare const getPoolAddress: ((pool: Pool) => string | '') & import("lodash").MemoizedFunction;
export declare function getTokenPrice(pool: Pool, base: Currency, quote: Currency): Price<Currency, Currency>;
