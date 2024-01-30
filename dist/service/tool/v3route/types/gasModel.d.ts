import type { Currency, CurrencyAmount } from '../../sdk';
import type { Pool } from '../../../vo';
import type { GasCost } from './gasCost';
export interface L1ToL2GasCosts {
    gasUsedL1: bigint;
    gasCostL1USD: CurrencyAmount<Currency>;
    gasCostL1QuoteToken: CurrencyAmount<Currency>;
}
export interface GasEstimateRequiredInfo {
    initializedTickCrossedList: number[];
}
export interface GasModel {
    estimateGasCost: (pools: Pool[], initializedTickCrossedList: number[]) => GasCost;
}
