"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Q128 = exports.ZERO_PERCENT = exports.ONE_HUNDRED_PERCENT = exports.MAX_FEE = exports.Q192 = exports.Q96 = exports.ONE = exports.ZERO = exports.NEGATIVE_ONE = void 0;
// constants used internally but not expected to be used externally
const fractions_1 = require("../fractions");
exports.NEGATIVE_ONE = BigInt(-1);
exports.ZERO = 0n;
exports.ONE = 1n;
// used in liquidity amount math
exports.Q96 = 2n ** 96n;
exports.Q192 = exports.Q96 ** 2n;
// used in fee calculation
exports.MAX_FEE = 10n ** 6n;
exports.ONE_HUNDRED_PERCENT = new fractions_1.Percent('1');
exports.ZERO_PERCENT = new fractions_1.Percent('0');
exports.Q128 = 2n ** 128n;
