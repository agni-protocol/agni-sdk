"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pair = exports.computePairAddress = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const ethers_1 = require("ethers");
const fractions_1 = require("../../fractions");
const errors_1 = require("../../errors");
const constants_1 = require("../../constants");
const utils_1 = require("../../utils");
const token_1 = require("../../token");
const Constant_1 = require("../../../../../Constant");
const PAIR_ADDRESS_CACHE = {};
const composeKey = (token0, token1) => `${token0.chainId}-${token0.address}-${token1.address}`;
function getCreate2Address(from_, salt_, initCodeHash) {
    return ethers_1.ethers.getCreate2Address(from_, salt_, initCodeHash);
}
const computePairAddress = ({ factoryAddress, tokenA, tokenB, }) => {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]; // does safety checks
    const key = composeKey(token0, token1);
    if (PAIR_ADDRESS_CACHE[key] === undefined) {
        PAIR_ADDRESS_CACHE[key] = getCreate2Address(factoryAddress, (0, ethers_1.solidityPackedKeccak256)(['address', 'address'], [token0.address, token1.address]), (0, Constant_1.getCurrentAddressInfo)().v2InitCodeHash);
    }
    return PAIR_ADDRESS_CACHE[key];
};
exports.computePairAddress = computePairAddress;
class Pair {
    static getAddress(tokenA, tokenB) {
        return (0, exports.computePairAddress)({
            factoryAddress: (0, Constant_1.getCurrentAddressInfo)().v2Factory,
            tokenA,
            tokenB,
        });
    }
    constructor(currencyAmountA, tokenAmountB) {
        const tokenAmounts = currencyAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
            ? [currencyAmountA, tokenAmountB]
            : [tokenAmountB, currencyAmountA];
        this.liquidityToken = new token_1.Token(tokenAmounts[0].currency.chainId, Pair.getAddress(tokenAmounts[0].currency, tokenAmounts[1].currency), 18, 'Cake-LP', 'Pancake LPs');
        this.tokenAmounts = tokenAmounts;
    }
    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    involvesToken(token) {
        return token.equals(this.token0) || token.equals(this.token1);
    }
    /**
     * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
     */
    get token0Price() {
        const result = this.tokenAmounts[1].divide(this.tokenAmounts[0]);
        return new fractions_1.Price(this.token0, this.token1, result.denominator, result.numerator);
    }
    /**
     * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
     */
    get token1Price() {
        const result = this.tokenAmounts[0].divide(this.tokenAmounts[1]);
        return new fractions_1.Price(this.token1, this.token0, result.denominator, result.numerator);
    }
    /**
     * Return the price of the given token in terms of the other token in the pair.
     * @param token token to return price of
     */
    priceOf(token) {
        (0, tiny_invariant_1.default)(this.involvesToken(token), 'TOKEN');
        return token.equals(this.token0) ? this.token0Price : this.token1Price;
    }
    /**
     * Returns the chain ID of the tokens in the pair.
     */
    get chainId() {
        return this.token0.chainId;
    }
    get token0() {
        return this.tokenAmounts[0].currency;
    }
    get token1() {
        return this.tokenAmounts[1].currency;
    }
    get reserve0() {
        return this.tokenAmounts[0];
    }
    get reserve1() {
        return this.tokenAmounts[1];
    }
    reserveOf(token) {
        (0, tiny_invariant_1.default)(this.involvesToken(token), 'TOKEN');
        return token.equals(this.token0) ? this.reserve0 : this.reserve1;
    }
    getOutputAmount(inputAmount) {
        (0, tiny_invariant_1.default)(this.involvesToken(inputAmount.currency), 'TOKEN');
        if (this.reserve0.quotient === constants_1.ZERO || this.reserve1.quotient === constants_1.ZERO) {
            throw new errors_1.InsufficientReservesError();
        }
        const inputReserve = this.reserveOf(inputAmount.currency);
        const outputReserve = this.reserveOf(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0);
        const inputAmountWithFee = inputAmount.quotient * constants_1._9975;
        const numerator = inputAmountWithFee * outputReserve.quotient;
        const denominator = inputReserve.quotient * constants_1._10000 + inputAmountWithFee;
        const outputAmount = fractions_1.CurrencyAmount.fromRawAmount(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0, numerator / denominator);
        if (outputAmount.quotient === constants_1.ZERO) {
            throw new errors_1.InsufficientInputAmountError();
        }
        return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))];
    }
    getInputAmount(outputAmount) {
        (0, tiny_invariant_1.default)(this.involvesToken(outputAmount.currency), 'TOKEN');
        if (this.reserve0.quotient === constants_1.ZERO ||
            this.reserve1.quotient === constants_1.ZERO ||
            outputAmount.quotient >= this.reserveOf(outputAmount.currency).quotient) {
            throw new errors_1.InsufficientReservesError();
        }
        const outputReserve = this.reserveOf(outputAmount.currency);
        const inputReserve = this.reserveOf(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0);
        const numerator = inputReserve.quotient * outputAmount.quotient * constants_1._10000;
        const denominator = (outputReserve.quotient - outputAmount.quotient) * constants_1._9975;
        const inputAmount = fractions_1.CurrencyAmount.fromRawAmount(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0, numerator / denominator + constants_1.ONE);
        return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))];
    }
    getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB) {
        (0, tiny_invariant_1.default)(totalSupply.currency.equals(this.liquidityToken), 'LIQUIDITY');
        const tokenAmounts = tokenAmountA.currency.sortsBefore(tokenAmountB.currency) // does safety checks
            ? [tokenAmountA, tokenAmountB]
            : [tokenAmountB, tokenAmountA];
        (0, tiny_invariant_1.default)(tokenAmounts[0].currency.equals(this.token0) && tokenAmounts[1].currency.equals(this.token1), 'TOKEN');
        let liquidity;
        if (totalSupply.quotient === constants_1.ZERO) {
            liquidity = (0, utils_1.sqrt)(tokenAmounts[0].quotient * tokenAmounts[1].quotient) - constants_1.MINIMUM_LIQUIDITY;
        }
        else {
            const amount0 = (tokenAmounts[0].quotient * totalSupply.quotient) / this.reserve0.quotient;
            const amount1 = (tokenAmounts[1].quotient * totalSupply.quotient) / this.reserve1.quotient;
            liquidity = amount0 <= amount1 ? amount0 : amount1;
        }
        if (!(liquidity > constants_1.ZERO)) {
            throw new errors_1.InsufficientInputAmountError();
        }
        return fractions_1.CurrencyAmount.fromRawAmount(this.liquidityToken, liquidity);
    }
    getLiquidityValue(token, totalSupply, liquidity, feeOn = false, kLast) {
        (0, tiny_invariant_1.default)(this.involvesToken(token), 'TOKEN');
        (0, tiny_invariant_1.default)(totalSupply.currency.equals(this.liquidityToken), 'TOTAL_SUPPLY');
        (0, tiny_invariant_1.default)(liquidity.currency.equals(this.liquidityToken), 'LIQUIDITY');
        (0, tiny_invariant_1.default)(liquidity.quotient <= totalSupply.quotient, 'LIQUIDITY');
        let totalSupplyAdjusted;
        if (!feeOn) {
            totalSupplyAdjusted = totalSupply;
        }
        else {
            (0, tiny_invariant_1.default)(!!kLast, 'K_LAST');
            const kLastParsed = BigInt(kLast);
            if (!(kLastParsed === constants_1.ZERO)) {
                const rootK = (0, utils_1.sqrt)(this.reserve0.quotient * this.reserve1.quotient);
                const rootKLast = (0, utils_1.sqrt)(kLastParsed);
                if (rootK > rootKLast) {
                    const numerator = totalSupply.quotient * (rootK - rootKLast);
                    const denominator = rootK * constants_1.FIVE + rootKLast;
                    const feeLiquidity = numerator / denominator;
                    totalSupplyAdjusted = totalSupply.add(fractions_1.CurrencyAmount.fromRawAmount(this.liquidityToken, feeLiquidity));
                }
                else {
                    totalSupplyAdjusted = totalSupply;
                }
            }
            else {
                totalSupplyAdjusted = totalSupply;
            }
        }
        return fractions_1.CurrencyAmount.fromRawAmount(token, (liquidity.quotient * this.reserveOf(token).quotient) / totalSupplyAdjusted.quotient);
    }
}
exports.Pair = Pair;
