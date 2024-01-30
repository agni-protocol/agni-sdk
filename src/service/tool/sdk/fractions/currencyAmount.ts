import BigNumber from 'bignumber.js'
import type { Currency } from '../currency'
import type { Token } from '../token'

import type { BigintIsh } from '../constants'
import { MaxUint256, Rounding } from '../constants'
import { invariant } from '../../math/Common'
import { Fraction } from './fraction'

export class CurrencyAmount<T extends Currency> extends Fraction {
  public readonly currency: T

  public readonly decimalScale: bigint

  /**
   * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
   * @param currency the currency in the amount
   * @param rawAmount the raw token or ether amount
   */
  public static fromRawAmount<T extends Currency>(currency: T, rawAmount: BigintIsh): CurrencyAmount<T> {
    return new CurrencyAmount(currency, rawAmount)
  }

  /**
   * Construct a currency amount with a denominator that is not equal to 1
   * @param currency the currency
   * @param numerator the numerator of the fractional token amount
   * @param denominator the denominator of the fractional token amount
   */
  public static fromFractionalAmount<T extends Currency>(
    currency: T,
    numerator: BigintIsh,
    denominator: BigintIsh,
  ): CurrencyAmount<T> {
    return new CurrencyAmount(currency, numerator, denominator)
  }

  protected constructor(currency: T, numerator: BigintIsh, denominator?: BigintIsh) {
    super(numerator, denominator)
    invariant(this.quotient <= MaxUint256, 'AMOUNT')
    this.currency = currency
    this.decimalScale = 10n ** BigInt(currency.decimals)
  }

  public add(other: CurrencyAmount<T>): CurrencyAmount<T> {
    invariant(this.currency.equals(other.currency), 'CURRENCY')
    const added = super.add(other)
    return CurrencyAmount.fromFractionalAmount(this.currency, added.numerator, added.denominator)
  }

  public subtract(other: CurrencyAmount<T>): CurrencyAmount<T> {
    invariant(this.currency.equals(other.currency), 'CURRENCY')
    const subtracted = super.subtract(other)
    return CurrencyAmount.fromFractionalAmount(this.currency, subtracted.numerator, subtracted.denominator)
  }

  public multiply(other: Fraction | BigintIsh): CurrencyAmount<T> {
    const multiplied = super.multiply(other)
    return CurrencyAmount.fromFractionalAmount(this.currency, multiplied.numerator, multiplied.denominator)
  }

  public divide(other: Fraction | BigintIsh): CurrencyAmount<T> {
    const divided = super.divide(other)
    return CurrencyAmount.fromFractionalAmount(this.currency, divided.numerator, divided.denominator)
  }

  public toSignificant(significantDigits = 6, format?: object, rounding: Rounding = Rounding.ROUND_DOWN): string {
    return super.divide(this.decimalScale).toSignificant(significantDigits, format, rounding)
  }

  public toFixed(
    decimalPlaces: number = this.currency.decimals,
    format?: object,
    rounding: Rounding = Rounding.ROUND_DOWN,
  ): string {
    invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS')
    return super.divide(this.decimalScale).toFixed(decimalPlaces, format, rounding)
  }

  public toExact(format: object = { groupSeparator: '' }): string {
    return new BigNumber(this.quotient.toString()).div(this.decimalScale.toString())
      .dp(this.currency.decimals, BigNumber.ROUND_DOWN)
      .toFormat(this.currency.decimals, format)
  }

  public get wrapped(): CurrencyAmount<Token> {
    if (this.currency.isToken)
      return this as CurrencyAmount<Token>
    return CurrencyAmount.fromFractionalAmount(this.currency.wrapped, this.numerator, this.denominator)
  }
}
