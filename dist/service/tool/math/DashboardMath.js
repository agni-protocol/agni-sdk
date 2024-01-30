"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardMath = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
class DashboardMath {
}
exports.DashboardMath = DashboardMath;
DashboardMath.get2DayChange = (valueNow, value24HoursAgo, value48HoursAgo) => {
    // get volume info for both 24 hour periods
    const currentChange = new bignumber_js_1.default(valueNow).minus(value24HoursAgo).toNumber();
    const previousChange = new bignumber_js_1.default(value24HoursAgo).minus(value48HoursAgo).toNumber();
    const adjustedPercentChange = new bignumber_js_1.default(currentChange).minus(previousChange).multipliedBy('100').div(previousChange).toNumber();
    if (new bignumber_js_1.default(adjustedPercentChange).isNaN() || !new bignumber_js_1.default(adjustedPercentChange).isFinite())
        return [currentChange, 0];
    return [currentChange, adjustedPercentChange];
};
/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
DashboardMath.getPercentChange = (valueNow, value24HoursAgo) => {
    if (valueNow && value24HoursAgo) {
        const change = ((Number.parseFloat((valueNow).toString()) - Number.parseFloat(value24HoursAgo.toString())) / Number.parseFloat(value24HoursAgo.toString())) * 100;
        if (Number.isFinite(change))
            return change;
    }
    return 0;
};
