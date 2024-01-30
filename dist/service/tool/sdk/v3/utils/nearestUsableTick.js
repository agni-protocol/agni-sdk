"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearestUsableTick = void 0;
const Common_1 = require("../../../math/Common");
const tickMath_1 = require("./tickMath");
/**
 * Returns the closest tick that is nearest a given tick and usable for the given tick spacing
 * @param tick the target tick
 * @param tickSpacing the spacing of the pool
 */
function nearestUsableTick(tick, tickSpacing) {
    (0, Common_1.invariant)(Number.isInteger(tick) && Number.isInteger(tickSpacing), 'INTEGERS');
    (0, Common_1.invariant)(tickSpacing > 0, 'TICK_SPACING');
    (0, Common_1.invariant)(tick >= tickMath_1.TickMath.MIN_TICK && tick <= tickMath_1.TickMath.MAX_TICK, 'TICK_BOUND');
    const rounded = Math.round(tick / tickSpacing) * tickSpacing;
    if (rounded < tickMath_1.TickMath.MIN_TICK)
        return rounded + tickSpacing;
    if (rounded > tickMath_1.TickMath.MAX_TICK)
        return rounded - tickSpacing;
    return rounded;
}
exports.nearestUsableTick = nearestUsableTick;
