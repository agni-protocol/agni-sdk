"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeUtils = void 0;
class TimeUtils {
    static getDeltaTimestamps() {
        const currentTime = new Date().getTime();
        const t24h = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000) / 1000).toString());
        const t48h = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 2) / 1000).toString());
        const t7d = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 7) / 1000).toString());
        const t14d = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 14) / 1000).toString());
        return {
            t24h,
            t48h,
            t7d,
            t14d,
        };
    }
}
exports.TimeUtils = TimeUtils;
