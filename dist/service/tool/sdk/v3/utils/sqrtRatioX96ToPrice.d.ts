import type { Currency } from '../../currency';
import { Price } from '../../fractions';
export declare function sqrtRatioX96ToPrice(sqrtRatioX96: bigint, currencyA: Currency, currencyB: Currency): Price<import("../..").Token, import("../..").Token>;
