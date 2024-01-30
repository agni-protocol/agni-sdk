"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const fractions_1 = require("../../fractions");
class Route {
    constructor(pairs, input, output) {
        this._midPrice = null;
        (0, tiny_invariant_1.default)(pairs.length > 0, 'PAIRS');
        const { chainId } = pairs[0];
        (0, tiny_invariant_1.default)(pairs.every((pair) => pair.chainId === chainId), 'CHAIN_IDS');
        const wrappedInput = input.wrapped;
        (0, tiny_invariant_1.default)(pairs[0].involvesToken(wrappedInput), 'INPUT');
        (0, tiny_invariant_1.default)(typeof output === 'undefined' || pairs[pairs.length - 1].involvesToken(output.wrapped), 'OUTPUT');
        const path = [wrappedInput];
        for (const [i, pair] of pairs.entries()) {
            const currentInput = path[i];
            (0, tiny_invariant_1.default)(currentInput.equals(pair.token0) || currentInput.equals(pair.token1), 'PATH');
            // eslint-disable-next-line @typescript-eslint/no-shadow
            const output = currentInput.equals(pair.token0) ? pair.token1 : pair.token0;
            path.push(output);
        }
        this.pairs = pairs;
        this.path = path;
        this.input = input;
        this.output = output;
    }
    get midPrice() {
        if (this._midPrice !== null)
            return this._midPrice;
        const prices = [];
        for (const [i, pair] of this.pairs.entries()) {
            prices.push(this.path[i].equals(pair.token0)
                ? new fractions_1.Price(pair.reserve0.currency, pair.reserve1.currency, pair.reserve0.quotient, pair.reserve1.quotient)
                : new fractions_1.Price(pair.reserve1.currency, pair.reserve0.currency, pair.reserve1.quotient, pair.reserve0.quotient));
        }
        const reduced = prices.slice(1).reduce((accumulator, currentValue) => accumulator.multiply(currentValue), prices[0]);
        // eslint-disable-next-line no-return-assign
        return (this._midPrice = new fractions_1.Price(this.input, this.output, reduced.denominator, reduced.numerator));
    }
    get chainId() {
        return this.pairs[0].chainId;
    }
}
exports.Route = Route;
