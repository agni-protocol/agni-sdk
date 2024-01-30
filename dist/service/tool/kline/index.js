"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateData = exports.generatePriceLine = exports.PriceLine = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
class PriceLine {
}
exports.PriceLine = PriceLine;
function generatePriceLine(timeInterval, endTime, size = 500, contain, klineList) {
    return buildKline(klineList, parseInt(String(endTime / timeInterval), 10) * timeInterval, size, timeInterval, contain);
}
exports.generatePriceLine = generatePriceLine;
/**
 * K线聚合
 * @param priceLines
 */
function aggregateData(priceLines) {
    const kline = new PriceLine();
    if (priceLines.length > 0) {
        kline.time = priceLines[0].time;
        kline.priceUSD = new bignumber_js_1.default(priceLines[0].priceUSD).toFixed();
        return kline;
    }
    else {
        return undefined;
    }
}
exports.aggregateData = aggregateData;
/**
 * 补齐中间差的时间段 K线，
 * @param klines 实际交易的数据生成的 K线
 * @param id 结束的整点时刻
 * @param size 长度
 * @param timeInterval
 * @param contain 是否包含
 */
function buildKline(klines, id, size, timeInterval, contain) {
    const list = [];
    const last = id;
    for (const exchangeKLine of klines) {
        while (list.length < size && id >= exchangeKLine.time) {
            if (id === exchangeKLine.time) {
                if (contain) {
                    list.push(exchangeKLine);
                }
                else {
                    if (last !== exchangeKLine.time) {
                        list.push(exchangeKLine);
                    }
                }
            }
            else {
                const kline = new PriceLine();
                kline.time = id;
                kline.priceUSD = new bignumber_js_1.default(exchangeKLine.priceUSD).toFixed();
                if (contain) {
                    list.push(kline);
                }
                else {
                    if (last !== id) {
                        list.push(kline);
                    }
                }
            }
            id = id - timeInterval;
        }
        if (list.length > size) {
            break;
        }
    }
    return list;
}
