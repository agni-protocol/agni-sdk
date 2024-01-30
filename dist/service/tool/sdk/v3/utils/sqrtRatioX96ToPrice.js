"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqrtRatioX96ToPrice = void 0;
const internalConstants_1 = require("../internalConstants");
const fractions_1 = require("../../fractions");
function sqrtRatioX96ToPrice(sqrtRatioX96, currencyA, currencyB) {
    const ratioX192 = sqrtRatioX96 * sqrtRatioX96;
    return currencyA.wrapped.sortsBefore(currencyB.wrapped)
        ? new fractions_1.Price(currencyA.wrapped, currencyB.wrapped, internalConstants_1.Q192, ratioX192)
        : new fractions_1.Price(currencyA.wrapped, currencyB.wrapped, ratioX192, internalConstants_1.Q192);
}
exports.sqrtRatioX96ToPrice = sqrtRatioX96ToPrice;
