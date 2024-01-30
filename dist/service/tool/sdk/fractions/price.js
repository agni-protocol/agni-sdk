"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Price = void 0;
const Common_1 = require("../../math/Common");
const fraction_1 = require("./fraction");
const currencyAmount_1 = require("./currencyAmount");
class Price extends fraction_1.Fraction {
    /**
     * Construct a price, either with the base and quote currency amount, or the
     * @param args
     */
    constructor(...args) {
        let baseCurrency;
        let quoteCurrency;
        let denominator;
        let numerator;
        if (args.length === 4) {
            // eslint-disable-next-line @typescript-eslint/no-extra-semi
            [baseCurrency, quoteCurrency, denominator, numerator] = args;
        }
        else {
            const result = args[0].quoteAmount.divide(args[0].baseAmount);
            [baseCurrency, quoteCurrency, denominator, numerator] = [
                args[0].baseAmount.currency,
                args[0].quoteAmount.currency,
                result.denominator,
                result.numerator,
            ];
        }
        super(numerator, denominator);
        this.baseCurrency = baseCurrency;
        this.quoteCurrency = quoteCurrency;
        this.scalar = new fraction_1.Fraction(10n ** BigInt(baseCurrency.decimals), 10n ** BigInt(quoteCurrency.decimals));
    }
    /**
     * Flip the price, switching the base and quote currency
     */
    invert() {
        return new Price(this.quoteCurrency, this.baseCurrency, this.numerator, this.denominator);
    }
    /**
     * Multiply the price by another price, returning a new price. The other price must have the same base currency as this price's quote currency
     * @param other the other price
     */
    multiply(other) {
        (0, Common_1.invariant)(this.quoteCurrency.equals(other.baseCurrency), 'TOKEN');
        const fraction = super.multiply(other);
        return new Price(this.baseCurrency, other.quoteCurrency, fraction.denominator, fraction.numerator);
    }
    /**
     * Return the amount of quote currency corresponding to a given amount of the base currency
     * @param currencyAmount the amount of base currency to quote against the price
     */
    quote(currencyAmount) {
        (0, Common_1.invariant)(currencyAmount.currency.equals(this.baseCurrency), 'TOKEN');
        const result = super.multiply(currencyAmount);
        return currencyAmount_1.CurrencyAmount.fromFractionalAmount(this.quoteCurrency, result.numerator, result.denominator);
    }
    /**
     * Get the value scaled by decimals for formatting
     * @private
     */
    get adjustedForDecimals() {
        return super.multiply(this.scalar);
    }
    toSignificant(significantDigits = 6, format, rounding) {
        return this.adjustedForDecimals.toSignificant(significantDigits, format, rounding);
    }
    toFixed(decimalPlaces = 4, format, rounding) {
        return this.adjustedForDecimals.toFixed(decimalPlaces, format, rounding);
    }
}
exports.Price = Price;
