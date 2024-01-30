import { Currency, CurrencyAmount } from "../../sdk";
export interface GasCost {
    gasEstimate: bigint;
    gasCostInToken: CurrencyAmount<Currency>;
    gasCostInUSD: CurrencyAmount<Currency>;
}
