"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityMath = void 0;
const internalConstants_1 = require("../internalConstants");
class LiquidityMath {
    /**
     * Cannot be constructed.
     */
    constructor() { }
    static addDelta(x, y) {
        if (y < internalConstants_1.ZERO)
            return x - y * internalConstants_1.NEGATIVE_ONE;
        return x + y;
    }
}
exports.LiquidityMath = LiquidityMath;
