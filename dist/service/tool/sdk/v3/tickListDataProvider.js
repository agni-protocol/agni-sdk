"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickListDataProvider = void 0;
const tick_1 = require("./tick");
const utils_1 = require("./utils");
/**
 * A data provider for ticks that is backed by an in-memory array of ticks.
 */
class TickListDataProvider {
    constructor(ticks) {
        const ticksMapped = ticks.map(t => (t instanceof tick_1.Tick ? t : new tick_1.Tick(t)));
        // TickList.validateList(ticksMapped, tickSpacing)
        this.ticks = ticksMapped;
    }
    async getTick(tick) {
        return utils_1.TickList.getTick(this.ticks, tick);
    }
    async nextInitializedTickWithinOneWord(tick, lte, tickSpacing) {
        return utils_1.TickList.nextInitializedTickWithinOneWord(this.ticks, tick, lte, tickSpacing);
    }
}
exports.TickListDataProvider = TickListDataProvider;
