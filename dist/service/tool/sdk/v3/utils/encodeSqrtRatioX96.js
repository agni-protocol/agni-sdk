"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeSqrtRatioX96 = void 0;
const utils_1 = require("../../utils");
function encodeSqrtRatioX96(amount1, amount0) {
    const numerator = BigInt(amount1) << 192n;
    const denominator = BigInt(amount0);
    const ratioX192 = numerator / denominator;
    return (0, utils_1.sqrt)(ratioX192);
}
exports.encodeSqrtRatioX96 = encodeSqrtRatioX96;
