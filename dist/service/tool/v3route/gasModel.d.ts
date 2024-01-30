import type { BigintIsh, Currency } from '../sdk';
import type { GasModel } from './types';
interface GasModelConfig {
    gasPriceWei: BigintIsh;
    quoteCurrency: Currency;
}
export declare function createGasModel({ gasPriceWei, quoteCurrency, }: GasModelConfig): Promise<GasModel>;
export {};
