"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullMath = void 0;
const internalConstants_1 = require("../internalConstants");
class FullMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static mulDivRoundingUp(a, b, denominator) {
        const product = a * b;
        let result = product / denominator;
        if (product % denominator !== internalConstants_1.ZERO)
            result = result + internalConstants_1.ONE;
        return result;
    }
}
exports.FullMath = FullMath;
