"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mostSignificantBit = void 0;
const internalConstants_1 = require("../internalConstants");
const Common_1 = require("../../../math/Common");
const constants_1 = require("../../constants");
const TWO = 2n;
const POWERS_OF_2 = [128, 64, 32, 16, 8, 4, 2, 1].map((pow) => [pow, TWO ** BigInt(pow)]);
function mostSignificantBit(x) {
    (0, Common_1.invariant)(x > internalConstants_1.ZERO, 'ZERO');
    (0, Common_1.invariant)(x <= constants_1.MaxUint256, 'MAX');
    let msb = 0;
    for (const [power, min] of POWERS_OF_2) {
        if (x >= min) {
            x = x >> BigInt(power);
            msb += power;
        }
    }
    return msb;
}
exports.mostSignificantBit = mostSignificantBit;
