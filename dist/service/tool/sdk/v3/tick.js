"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tick = void 0;
const Common_1 = require("../../math/Common");
const utils_1 = require("./utils");
class Tick {
    constructor({ index, liquidityGross, liquidityNet }) {
        (0, Common_1.invariant)(index >= utils_1.TickMath.MIN_TICK && index <= utils_1.TickMath.MAX_TICK, 'TICK');
        this.index = index;
        this.liquidityGross = BigInt(liquidityGross);
        this.liquidityNet = BigInt(liquidityNet);
    }
}
exports.Tick = Tick;
