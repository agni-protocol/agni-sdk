import BigNumber from 'bignumber.js'
import get from 'lodash/get'
import {CacheKey, TimeUtils} from '../tool'
import type {
  Block,
  DashboardChartDayData,
  DashboardChartResults,
  DashboardGlobalResponse,
  DashboardPoolData,
  DashboardPoolDataResponse,
  DashboardPoolFields,
  DashboardPricesResponse,
  DashboardProtocolData,
  DashboardTokenData,
  DashboardTokenDataResponse,
  DashboardTokenFields,
  DashboardTransaction,
  DashboardTransactionEntry,
} from '../vo'
import {DashboardTransactionType,} from '../vo'
import {DashboardMath} from '../tool/math/DashboardMath'
import type {BaseApi} from './BaseApi'
import {BASE_API} from './BaseApi'
import {
  ethPricesGQL,
  globalChartGQL,
  globalDataGQL,
  globalTransactionsGQL,
  poolsBulkGQL,
  QueryBlockMeta,
  QueryBlockMetaVo,
  QueryBlockTimeGQL,
  tokensBulkGQL,
  topPoolsGQL, topTokensGQL, TopTokensGQLVo
} from "./gql/DashboardGql";


@CacheKey('DashboardApi')
export class DashboardApi {
  private baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  async getBlocksFromTimestamps(
    timestamps: number[],
    type: 'exchange-v3' = 'exchange-v3',
  ): Promise<Block[]> {
    if (timestamps?.length === 0)
      return []

    const queryBlockMetaVo = await this.baseApi.exchangeV3Graph<QueryBlockMetaVo>(QueryBlockMeta(), {})
    const maxBlockNumber = queryBlockMetaVo._meta.block.number

    const timestampsResult = await this.baseApi.blockGraph(
      QueryBlockTimeGQL(timestamps),
      {},
    )
    const blocks: Block[] = []

    for (const timestamp of timestamps) {
      if (timestampsResult[`t${timestamp}`].length > 0) {
        const number = Number.parseInt(timestampsResult[`t${timestamp}`][0].number, 10)
        blocks.push({
          timestamp: timestamp.toString(),
          number: number > maxBlockNumber ? maxBlockNumber : number,
        })
      } else {
        blocks.push({
          timestamp: timestamp.toString(),
          number: undefined,
        })
      }
    }
    return blocks
  }

  async protocolData(): Promise<DashboardProtocolData> {
    const deltaTimestamps = TimeUtils.getDeltaTimestamps()
    const [block24,block48] = await this.getBlocksFromTimestamps(
      [deltaTimestamps.t24h,deltaTimestamps.t48h],
    )

    const blockNumbers = Array.from([undefined, block24.number,block48.number])
    const globalResponses = await Promise.all(
      blockNumbers.map(it => this.baseApi.exchangeV3Graph<DashboardGlobalResponse>(globalDataGQL(it), {})),
    )

    // const ethPrices = await this.ethPriceDatas()

    const data = globalResponses[blockNumbers.indexOf(undefined)]
    const data24 = globalResponses[blockNumbers.indexOf(block24.number)]
    const data48 = globalResponses[blockNumbers.indexOf(block48.number)]

    const parsed = data?.factories?.[0]
    const parsed24 = data24?.factories?.[0]
    const parsed48 = data48?.factories?.[0]

    // volume data
    const volumeUSD
      = parsed && parsed24
      ? Number.parseFloat(parsed.totalVolumeUSD) - Number.parseFloat(parsed24.totalVolumeUSD)
      : Number.parseFloat(parsed.totalVolumeUSD)

    const volumeOneWindowAgo = Number.parseFloat(get(parsed24, 'totalVolumeUSD', '0')) - Number.parseFloat(get(parsed48, 'totalVolumeUSD', '0'))

    const volumeUSDChange
      = volumeUSD && volumeOneWindowAgo ? ((volumeUSD - volumeOneWindowAgo) / volumeOneWindowAgo) * 100 : 0

    // total value locked
    const tvlUSDChange = DashboardMath.getPercentChange(parsed?.totalValueLockedUSD, parsed24?.totalValueLockedUSD)

    // 24H transactions
    const txCount
      = parsed && parsed24 ? Number.parseFloat(parsed.txCount) - Number.parseFloat(parsed24.txCount) : Number.parseFloat(parsed.txCount)

    const txCountOneWindowAgo = Number.parseFloat(get(parsed24, 'txCount', '0')) - Number.parseFloat(get(parsed48, 'txCount', '0'))

    const txCountChange
      = txCount && txCountOneWindowAgo ? DashboardMath.getPercentChange(txCount.toString(), txCountOneWindowAgo.toString()) : 0

    const feesOneWindowAgo = new BigNumber(get(parsed24, 'totalFeesUSD', '0'))
      .minus(get(parsed24, 'totalProtocolFeesUSD', '0'))
      .minus(new BigNumber(get(parsed48, 'totalFeesUSD', '0')).minus(get(parsed48, 'totalProtocolFeesUSD', '0')))

    const feesUSD
      = parsed && parsed24
      ? new BigNumber(parsed.totalFeesUSD)
        .minus(parsed.totalProtocolFeesUSD)
        .minus(new BigNumber(parsed24.totalFeesUSD).minus(parsed24.totalProtocolFeesUSD))
      : new BigNumber(parsed.totalFeesUSD).minus(parsed.totalProtocolFeesUSD)

    const feeChange
      = feesUSD && feesOneWindowAgo ? DashboardMath.getPercentChange(feesUSD.toString(), feesOneWindowAgo.toString()) : 0
    const formattedData = {
      volumeUSD,
      volumeUSDChange: typeof volumeUSDChange === 'number' ? volumeUSDChange : 0,
      totalVolumeUSD: Number.parseFloat(parsed?.totalVolumeUSD),
      tvlUSD: Number.parseFloat(parsed?.totalValueLockedUSD),
      tvlUSDChange,
      feesUSD: feesUSD.toNumber(),
      feeChange,
      txCount,
      txCountChange,
    }
    return formattedData
  }

  async chartData(): Promise<DashboardChartDayData[]> {
    let data: {
      date: number
      volumeUSD: string
      tvlUSD: string
    }[] = []
    const ONE_DAY_UNIX = 24 * 60 * 60
    const startTimestamp = 1619170975
    const endTimestamp = Number.parseInt(Number(new Date().getTime() / 1000).toString())
    const skip = 0

    const chartData = await this.baseApi.exchangeV3Graph<DashboardChartResults>(globalChartGQL, {
      startTime: startTimestamp,
      skip,
    })
    data = chartData.pancakeDayDatas

    const formattedExisting = data.reduce((accum: { [date: number]: DashboardChartDayData }, dayData) => {
      const roundedDate = Number.parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))

      accum[roundedDate] = {
        date: dayData.date,
        volumeUSD: Number.parseFloat(dayData.volumeUSD),
        tvlUSD: Number.parseFloat(dayData.tvlUSD),
      }
      return accum
    }, {})

    const firstEntry = formattedExisting[Number.parseInt(Object.keys(formattedExisting)[0])]

    // fill in empty days ( there will be no day datas if no trades made that day )
    let timestamp = firstEntry?.date ?? startTimestamp
    let latestTvl = firstEntry?.tvlUSD ?? 0
    while (timestamp < endTimestamp - ONE_DAY_UNIX) {
      const nextDay = timestamp + ONE_DAY_UNIX
      const currentDayIndex = Number.parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
      if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
        formattedExisting[currentDayIndex] = {
          date: nextDay,
          volumeUSD: 0,
          tvlUSD: latestTvl,
        }
      } else {
        latestTvl = formattedExisting[currentDayIndex].tvlUSD
      }
      timestamp = nextDay
    }

    return Object.values(formattedExisting)
  }

  async topPool(): Promise<Record<string, DashboardPoolData>> {
    const deltaTimestamps = TimeUtils.getDeltaTimestamps()
    const [block24,block48] = await this.getBlocksFromTimestamps(
      [deltaTimestamps.t24h,deltaTimestamps.t48h],
    )
    const poolAddresses = (await this.baseApi.exchangeV3Graph<{
      pools: { id: string }[]
    }>(topPoolsGQL, {})).pools.map(it => it.id)
    return await this.poolDatas(poolAddresses, block24,block48)
  }

  async ethPriceDatas() {
    const deltaTimestamps = TimeUtils.getDeltaTimestamps()
    const [block24,block48] = await this.getBlocksFromTimestamps(
      [deltaTimestamps.t24h,deltaTimestamps.t48h],
    )
    const pricesResponse = (await this.baseApi.exchangeV3Graph<DashboardPricesResponse>(ethPricesGQL(
      block24.number,
      block48.number,
      block48.number,
    ), {}))
    return {
      current: Number.parseFloat(get(pricesResponse, 'current[0].ethPriceUSD', '0')),
      oneDay: Number.parseFloat(get(pricesResponse, 'oneDay[0].ethPriceUSD', '0')),
      twoDay: Number.parseFloat(get(pricesResponse, 'twoDay[0].ethPriceUSD', '0')),
      week: Number.parseFloat(get(pricesResponse, 'oneWeek[0].ethPriceUSD', '0')),
    }
  }

  async topToken(): Promise<Record<string, DashboardTokenData>> {
    const deltaTimestamps = TimeUtils.getDeltaTimestamps()
    const [block24,block48] = await this.getBlocksFromTimestamps(
      [deltaTimestamps.t24h,deltaTimestamps.t48h],
    )
    const tokenAddresses = (await this.baseApi.exchangeV3Graph<TopTokensGQLVo>(topTokensGQL, {})).tokens
      .sort((a, b) => Number.parseFloat(b.totalValueLockedUSD) - Number.parseFloat(a.totalValueLockedUSD))
      .map(it => it.id)
      // 取前50个
      .slice(0, 50)
    if (tokenAddresses.length === 0)
      return {}

    const blockNumbers = [undefined, block24.number,block48.number]
    const tokenDataResponses = []
    for (const blockNumber of blockNumbers)
      tokenDataResponses.push(await this.baseApi.exchangeV3Graph<DashboardTokenDataResponse>(tokensBulkGQL(blockNumber, tokenAddresses), {}))

    // const ethPrices = await this.ethPriceDatas()

    const data = tokenDataResponses[blockNumbers.indexOf(undefined)]
    const data24 = tokenDataResponses[blockNumbers.indexOf(block24.number)]
    const data48 = tokenDataResponses[blockNumbers.indexOf(block48.number)]
    const dataWeek = tokenDataResponses[blockNumbers.indexOf(block24.number)]

    const parsed = data?.tokens
      ? data.tokens.reduce((accum: { [address: string]: DashboardTokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsed24 = data24?.tokens
      ? data24.tokens.reduce((accum: { [address: string]: DashboardTokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsed48 = data48?.tokens
      ? data48.tokens.reduce((accum: { [address: string]: DashboardTokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsedWeek = dataWeek?.tokens
      ? dataWeek.tokens.reduce((accum: { [address: string]: DashboardTokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}

    // format data and calculate daily changes
    const formatted = tokenAddresses.reduce((accum: { [address: string]: DashboardTokenData }, address) => {
      const current: DashboardTokenFields | undefined = parsed[address]
      const oneDay: DashboardTokenFields | undefined = parsed24[address]
      const twoDay: DashboardTokenFields | undefined = parsed48[address]
      const week: DashboardTokenFields | undefined = parsedWeek[address]

      const [volumeUSD, volumeUSDChange]
        = current && oneDay && twoDay
        ? DashboardMath.get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
          ? [Number.parseFloat(current.volumeUSD), 0]
          : [0, 0]

      const volumeUSDWeek
        = current && week
        ? Number.parseFloat(current.volumeUSD) - Number.parseFloat(week.volumeUSD)
        : current
          ? Number.parseFloat(current.volumeUSD)
          : 0
      const tvlUSD = current ? Number.parseFloat(current.totalValueLockedUSD) : 0
      const tvlUSDChange = DashboardMath.getPercentChange(
        Number.parseFloat(current?.totalValueLockedUSD).toFixed(),
        Number.parseFloat(oneDay?.totalValueLockedUSD).toFixed(),
      )
      const tvlToken = current ? Number.parseFloat(current.totalValueLocked) : 0
      const priceUSD = current ? Number.parseFloat(current.derivedUSD) : 0
      const priceUSDOneDay = oneDay ? Number.parseFloat(oneDay.derivedUSD)  : 0
      const priceUSDWeek = week ? Number.parseFloat(week.derivedUSD)  : 0
      const priceUSDChange = priceUSD && priceUSDOneDay ? DashboardMath.getPercentChange(priceUSD, priceUSDOneDay) : 0

      const priceUSDChangeWeek = priceUSD && priceUSDWeek ? DashboardMath.getPercentChange(priceUSD, priceUSDWeek) : 0
      const txCount
        = current && oneDay
        ? Number.parseFloat(current.txCount) - Number.parseFloat(oneDay.txCount)
        : current
          ? Number.parseFloat(current.txCount)
          : 0
      const feesUSD
        = current && oneDay
        ? Number.parseFloat(current.feesUSD) - Number.parseFloat(oneDay.feesUSD)
        : current
          ? Number.parseFloat(current.feesUSD)
          : 0

      accum[address] = {
        exists: !!current,
        address,
        name: current?.name ?? '',
        symbol: current?.symbol ?? '',
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        txCount,
        tvlUSD,
        feesUSD,
        tvlUSDChange,
        tvlToken,
        priceUSD,
        priceUSDChange,
        priceUSDChangeWeek,
      }

      return accum
    }, {})

    return formatted
  }

  private async poolDatas(poolAddresses: string[], block24: Block,block48:Block): Promise<Record<string, DashboardPoolData>> {
    if (poolAddresses.length === 0)
      return {}

    const blockNumbers = Array.from([undefined, block24.number,block48.number])

    const poolDataResponses = await Promise.all(
      blockNumbers.map(it => this.baseApi.exchangeV3Graph<DashboardPoolDataResponse>(poolsBulkGQL(it, poolAddresses), {})),
    )

    const data = poolDataResponses[blockNumbers.indexOf(undefined)]
    const data24 = poolDataResponses[blockNumbers.indexOf(block24.number)]
    const data48 = poolDataResponses[blockNumbers.indexOf(block48.number)]
    const dataWeek = poolDataResponses[blockNumbers.indexOf(block48.number)]

    const ethPriceUSD = data.bundles?.[0]?.ethPriceUSD ? Number.parseFloat(data.bundles[0].ethPriceUSD) : 0
    const parsed = data.pools
      ? data.pools.reduce((accum: { [address: string]: DashboardPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsed24 = data24?.pools
      ? data24.pools.reduce((accum: { [address: string]: DashboardPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsed48 = data48?.pools
      ? data48.pools.reduce((accum: { [address: string]: DashboardPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}
    const parsedWeek = dataWeek?.pools
      ? dataWeek.pools.reduce((accum: { [address: string]: DashboardPoolFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
      : {}

    // format data and calculate daily changes
    const formatted = poolAddresses.reduce((accum: { [address: string]: DashboardPoolData }, address) => {
      const current: DashboardPoolFields | undefined = parsed[address]
      const oneDay: DashboardPoolFields | undefined = parsed24[address]
      const twoDay: DashboardPoolFields | undefined = parsed48[address]
      const week: DashboardPoolFields | undefined = parsedWeek[address]

      const [volumeUSD, volumeUSDChange]
        = current && oneDay && twoDay
        ? DashboardMath.get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
          ? [new BigNumber(current.volumeUSD).toFixed(), '0']
          : ['0', '0']

      const volumeUSDWeek
        = current && week
        ? Number.parseFloat(current.volumeUSD) - Number.parseFloat(week.volumeUSD)
        : current
          ? Number.parseFloat(current.volumeUSD)
          : 0
      const feeUSD
        = current && oneDay
        ? new BigNumber(current?.feesUSD)
          .minus(current?.protocolFeesUSD)
          .minus(new BigNumber(oneDay?.feesUSD).minus(oneDay?.protocolFeesUSD))
        : new BigNumber(current?.feesUSD).minus(current?.protocolFeesUSD)
      // Hotifx: Subtract fees from TVL to correct data while subgraph is fixed.
      /**
       * Note: see issue desribed here https://github.com/Uniswap/v3-subgraph/issues/74
       * During subgraph deploy switch this month we lost logic to fix this accounting.
       * Grafted sync pending fix now.
       * @chef-jojo: should be fixed on our version, but leaving this in for now
       */
      const feePercent = current ? new BigNumber(current.feeTier).div(10000).div(100).toFixed() : 0
      const tvlAdjust0 = current?.volumeToken0 ? (new BigNumber(current.volumeToken0).multipliedBy(feePercent).div(2).toFixed()) : '0'
      const tvlAdjust1 = current?.volumeToken1 ? (new BigNumber(current.volumeToken1).multipliedBy(feePercent).div(2).toFixed()) : '0'
      const tvlToken0 = current ? BigNumber.max(new BigNumber(current.totalValueLockedToken0).minus(tvlAdjust0), '0').toFixed() : '0'
      const tvlToken1 = current ? BigNumber.max(new BigNumber(current.totalValueLockedToken1).minus(tvlAdjust1), '0').toFixed() : '0'
      let tvlUSD = current ? new BigNumber(current.totalValueLockedUSD).toFixed() : '0'
      const tvlUSDChange
        = current && oneDay
        ? ((Number.parseFloat(current.totalValueLockedUSD) - Number.parseFloat(oneDay.totalValueLockedUSD))
          / Number.parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD))
        * 100
        : 0

      // Part of TVL fix
      const tvlUpdated = current
        ? new BigNumber(tvlToken0).multipliedBy(current.token0.derivedETH).multipliedBy(ethPriceUSD)
          .plus(
            new BigNumber(tvlToken1).multipliedBy(current.token1.derivedETH).multipliedBy(ethPriceUSD),
          ).toFixed()
        : undefined
      if (tvlUpdated)
        tvlUSD = tvlUpdated

      const feeTier = current ? Number.parseInt(current.feeTier) : 0

      if (current) {
        accum[address] = {
          address,
          feeTier,
          liquidity: Number.parseFloat(current.liquidity),
          sqrtPrice: Number.parseFloat(current.sqrtPrice),
          tick: Number.parseFloat(current.tick),
          token0: {
            address: current.token0.id,
            name: current.token0.name,
            symbol: current.token0.symbol,
            decimals: Number.parseInt(current.token0.decimals),
            derivedETH: Number.parseFloat(current.token0.derivedETH),
          },
          token1: {
            address: current.token1.id,
            name: current.token1.name,
            symbol: current.token1.symbol,
            decimals: Number.parseInt(current.token1.decimals),
            derivedETH: Number.parseFloat(current.token1.derivedETH),
          },
          token0Price: Number.parseFloat(current.token0Price),
          token1Price: Number.parseFloat(current.token1Price),
          volumeUSD: new BigNumber(volumeUSD).toNumber(),
          volumeUSDChange: new BigNumber(volumeUSDChange).toNumber(),
          volumeUSDWeek: new BigNumber(volumeUSDWeek).toNumber(),
          tvlUSD: new BigNumber(tvlUSD).toNumber(),
          tvlUSDChange,
          tvlToken0: new BigNumber(tvlToken0).toNumber(),
          tvlToken1: new BigNumber(tvlToken1).toNumber(),
          feeUSD: feeUSD.toNumber(),
        }
      }

      return accum
    }, {})

    return formatted
  }

  async topTransactions(): Promise<DashboardTransaction[]> {
    const data = await this.baseApi.exchangeV3Graph<DashboardTransactionEntry>(globalTransactionsGQL, {})
    const transactions = [
      {
        type: DashboardTransactionType.MINT,
        txs: data.mints,
      },
      {
        type: DashboardTransactionType.SWAP,
        txs: data.swaps,
      },
      {
        type: DashboardTransactionType.BURN,
        txs: data.burns,
      },
    ].flatMap(({type, txs}) => {
      return txs.map((m) => {
        return {
          type,
          hash: m.id.split('-')[0].split('#')[0],
          timestamp: m.timestamp,
          sender: m.origin,
          token0Symbol: m.token0.symbol,
          token1Symbol: m.token1.symbol,
          token0Address: m.token0.id,
          token1Address: m.token1.id,
          amountUSD: Number.parseFloat(m.amountUSD),
          amountToken0: Number.parseFloat(m.amount0),
          amountToken1: Number.parseFloat(m.amount1),
        } as DashboardTransaction
      })
    })
    return transactions.sort((a, b) => {
      return Number.parseInt(b.timestamp, 10) - Number.parseInt(a.timestamp, 10)
    })
  }
}
