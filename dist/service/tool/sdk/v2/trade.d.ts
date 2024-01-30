import { Trade } from './entities';
import { Currency } from "../currency";
import { TradeType } from "../constants";
import { Percent } from "../fractions";
export declare function isTradeBetter(tradeA: Trade<Currency, Currency, TradeType> | undefined | null, tradeB: Trade<Currency, Currency, TradeType> | undefined | null, minimumDelta?: Percent): boolean | undefined;
export default isTradeBetter;
