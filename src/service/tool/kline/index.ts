import BigNumber from "bignumber.js";

export class PriceLine{
  time: number
  priceUSD: string
}


export function generatePriceLine(
  timeInterval: number,
  endTime: number,
  size: number = 500,
  contain: boolean,
  klineList: PriceLine[],
): PriceLine[] {
  return buildKline(
    klineList,
    parseInt(String(endTime / timeInterval), 10) * timeInterval,
    size,
    timeInterval,
    contain,
  );
}


/**
 * K线聚合
 * @param priceLines
 */
export function aggregateData(priceLines: PriceLine[]): PriceLine {
  const kline = new PriceLine();
  if (priceLines.length > 0) {
    kline.time = priceLines[0].time;
    kline.priceUSD = new BigNumber(priceLines[0].priceUSD).toFixed();
    return kline;
  } else {
    return undefined
  }
}

/**
 * 补齐中间差的时间段 K线，
 * @param klines 实际交易的数据生成的 K线
 * @param id 结束的整点时刻
 * @param size 长度
 * @param timeInterval
 * @param contain 是否包含
 */
function buildKline( klines: PriceLine[], id: number,size: number, timeInterval: number, contain: boolean) {
  const list = [];
  const last = id;
  for (const exchangeKLine of klines) {
    while (list.length < size && id >= exchangeKLine.time) {
      if (id === exchangeKLine.time) {
        if (contain) {
          list.push(exchangeKLine);
        } else {
          if (last !== exchangeKLine.time) {
            list.push(exchangeKLine);
          }
        }
      } else {
        const kline = new PriceLine();
        kline.time = id;
        kline.priceUSD = new BigNumber(exchangeKLine.priceUSD).toFixed();
        if (contain) {
          list.push(kline);
        } else {
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
