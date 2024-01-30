import { AbiCoder, getCreate2Address, solidityPackedKeccak256 } from 'ethers'
import BigNumber from 'bignumber.js'
import type { Token } from '../tool'
import { CacheKey, CurrencyAmount, Percent, Price, Trace, isNumber } from '../tool'
import type {
  LiquidityHistory,
  PositionContractDetails,
  TickData,
  TickProcessed,
  TransactionEvent,
} from '../vo'
import {
  AddLiquidityV3Info,
  BalanceAndAllowance,
  ETH_ADDRESS,
  FeeAmount,
  LiquidityInfo,
  LiquidityListData,
  TICK_SPACINGS,
} from '../vo'
import type { ConnectInfo } from '../../ConnectInfo'
import { NonfungiblePositionManagerContract, PoolV3Contract } from '../abi'
import { getCurrentAddressInfo } from '../../Constant'
import { TickMath, encodeSqrtRatioX96, nearestUsableTick, priceToClosestTick, tickToPrice } from '../tool/sdk/v3/utils'
import { Pool, Position } from '../tool/sdk/v3'
import { ENDLESS, computeSurroundingTicks, tickToPriceString, tryParseTick } from '../tool/math/Common'
import { BasicException } from '../../BasicException'
import { BASE_API } from './BaseApi'
import type { BaseApi } from './BaseApi'
import { transactionHistory } from './TransactionHistory'
import {AllV3TicksGQL, FeeTierDistributionGQL, PositionHistoryGQL} from "./gql/PoolGql";

@CacheKey('PoolV3Api')
export class PoolV3Api {
  public baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  async myLiquidityList(connectInfo: ConnectInfo): Promise<{
    hideClosePosition: LiquidityListData[]
    allPosition: LiquidityListData[]
  }> {
    const nonfungiblePositionManager = connectInfo.create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
    const account = connectInfo.account
    const [{ balanceOf }] = await connectInfo.multiCall().call({
      balanceOf: nonfungiblePositionManager.mulContract.balanceOf(account),
    })

    if (balanceOf === '0') {
      return {
        hideClosePosition: [],
        allPosition: [],
      }
    }

    const tokenIds: {
      index: string
      tokenId: string
    }[] = await connectInfo.multiCall().call(...Array.from(Array.from({ length: Number.parseInt(balanceOf, 10) }).keys())
      .map((it) => {
        return {
          index: Number(it).toString(),
          tokenId: nonfungiblePositionManager.mulContract.tokenOfOwnerByIndex(account, it),
        }
      }))

    const positions: {
      tokenId: string
      position: PositionContractDetails
    }[] = await connectInfo.multiCall().call(...tokenIds.map((it) => {
      return {
        tokenId: it.tokenId,
        position: nonfungiblePositionManager.mulContract.positions(it.tokenId),
      }
    }))

    const batchGetTokens = await this.baseApi.address().getApi().tokenMangerApi().batchGetTokens(
      Array.from(new Set(positions.map(it => [it.position.token0, it.position.token1, ETH_ADDRESS]).flatMap(it => it))),
    )

    const pools = await this.getPool(positions.map((it) => {
      const token0 = batchGetTokens[it.position.token0.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : it.position.token0]
      const token1 = batchGetTokens[it.position.token1.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : it.position.token1]
      return {
        token0,
        token1,
        feeAmount: Number.parseInt(it.position.fee) as FeeAmount,
      }
    }))

    const allPosition = positions.map((it, index) => {
      const token0 = batchGetTokens[it.position.token0.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : it.position.token0]
      const token1 = batchGetTokens[it.position.token1.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : it.position.token1]
      const pool = pools[index]
      const liquidityDetails = new LiquidityListData()
      this.initLiquidityData(liquidityDetails, it.tokenId, token0, token1, pool, it.position)
      return liquidityDetails
    }).sort((a, b) => {
      const sortRank = {
        active: 1,
        inactive: 2,
        close: 3,
      }
      const rank1 = sortRank[a.state]
      const rank2 = sortRank[b.state]
      if (rank1 !== rank2)
        return rank1 - rank2

      return Number.parseInt(b.tokenId) - Number.parseInt(a.tokenId)
    })

    return {
      allPosition,
      hideClosePosition: allPosition.filter(it => it.state === 'close'),
    }
  }

  private initLiquidityData(liquidityDetails: LiquidityListData, tokenId: string, token0: Token, token1: Token, pool: Pool, position: PositionContractDetails) {
    liquidityDetails.tokenId = tokenId
    liquidityDetails.token0 = token0
    liquidityDetails.token1 = token1
    liquidityDetails.feeAmount = Number.parseInt(position.fee) as FeeAmount
    const price = pool.priceOf(token1).toFixed()
    liquidityDetails.minPrice = tickToPriceString(token1, token0, liquidityDetails.feeAmount, Number.parseInt(position.tickUpper))
    liquidityDetails.maxPrice = tickToPriceString(token1, token0, liquidityDetails.feeAmount, Number.parseInt(position.tickLower))
    liquidityDetails.currentPrice = price
    liquidityDetails.reverseMinPrice = liquidityDetails.maxPrice === ENDLESS ? '0' : new BigNumber(1).div(liquidityDetails.maxPrice).toFixed()
    liquidityDetails.reverseMaxPrice = liquidityDetails.minPrice === '0' ? ENDLESS : new BigNumber(1).div(liquidityDetails.minPrice).toFixed()
    liquidityDetails.reverseCurrentPrice = pool.priceOf(token0).toFixed()
    if (new BigNumber(position.liquidity).comparedTo('0') > 0) {
      if (pool.tickCurrent < Number.parseInt(position.tickLower) || pool.tickCurrent >= Number.parseInt(position.tickUpper))
        liquidityDetails.state = 'inactive'
      else
        liquidityDetails.state = 'active'
    }
    else {
      liquidityDetails.state = 'close'
    }
    liquidityDetails.liquidity = position.liquidity.toString()
  }

  async positionHistoryByTokenId(tokenId: string): Promise<LiquidityHistory[]> {
    interface Tx {
      id: string
      timestamp: string
      amount1: string
      amount0: string
      logIndex: string
    }

    const { positionSnapshots } = (await this.baseApi.exchangeV3Graph<{
      positionSnapshots: {
        id: string
        transaction: {
          mints: Tx[]
          burns: Tx[]
          collects: Tx[]
        }[]
      }[]

    }>(PositionHistoryGQL, { tokenId }))
    return positionSnapshots
      .flatMap(it => it.transaction)
      .flatMap((it) => {
        const mapToLiquidityHistory = (it: Tx, type: 'add' | 'remove' | 'collect_fee') => {
          return {
            time: Number.parseInt(it.timestamp) * 1000,
            type,
            txUrl: this.baseApi.address().getEtherscanTx(it.id.split('#')[0]),
            token0Amount: it.amount0,
            token1Amount: it.amount1,
          } as LiquidityHistory
        }
        return [
          ...it.mints.map(it => mapToLiquidityHistory(it, 'add')),
          ...it.burns.map(it => mapToLiquidityHistory(it, 'remove')),
          ...it.collects.map(it => mapToLiquidityHistory(it, 'collect_fee')),
        ]
      })
      .sort((a, b) => {
        return new BigNumber(b.time).comparedTo(a.time)
      })
  }

  async myLiquidityByTokenId(connectInfo: ConnectInfo, tokenId: string): Promise<LiquidityInfo> {
    const nonfungiblePositionManager = connectInfo.create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
    const account = connectInfo.account

    const [{
      position,
    }] = await this.baseApi.connectInfo().multiCall().call({
      position: nonfungiblePositionManager.mulContract.positions(tokenId),
    })

    if (position.fee === '0')
      throw new Error('token id not found')

    const batchGetTokens = await this.baseApi.address().getApi().tokenMangerApi().batchGetTokens(
      Array.from(new Set([position.token0, position.token1, ETH_ADDRESS])),
    )

    const token0 = batchGetTokens[position.token0.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : position.token0]
    const token1 = batchGetTokens[position.token1.toLowerCase() === this.baseApi.address().WMNT.toLowerCase() ? ETH_ADDRESS : position.token1]
    const feeAmount = Number.parseInt(position.fee) as FeeAmount

    const [[token0Price, token1Price], [pool], collect, liquidityHistory, balanceAndAllowances] = await Promise.all([
      this.baseApi.address().getApi().tokenMangerApi().tokenPrice(token0, token1),
      this.getPool([{ token0, token1, feeAmount }]),
      this.collectFeeData(tokenId, account),
      this.positionHistoryByTokenId(tokenId),
      this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(
        account,
        this.baseApi.address().nonfungiblePositionManager,
        [token0, token1],
      ),
    ])

    const positionDetail = new Position({
      pool,
      liquidity: position.liquidity,
      tickLower: Number.parseInt(position.tickLower),
      tickUpper: Number.parseInt(position.tickUpper),
    })

    const liquidityInfo = new LiquidityInfo()

    this.initLiquidityData(liquidityInfo, tokenId, token0, token1, pool, position)
    liquidityInfo.token0Amount = positionDetail.amount0.toFixed()
    liquidityInfo.token1Amount = positionDetail.amount1.toFixed()
    liquidityInfo.token0Balance = balanceAndAllowances[token0.address]
    liquidityInfo.token1Balance = balanceAndAllowances[token1.address]
    liquidityInfo.token0Price = token0Price
    liquidityInfo.token1Price = token1Price

    liquidityInfo.token0USD = new BigNumber(token0Price.priceUSD).multipliedBy(liquidityInfo.token0Amount).toFixed()
    liquidityInfo.token1USD = new BigNumber(token1Price.priceUSD).multipliedBy(liquidityInfo.token1Amount).toFixed()
    liquidityInfo.liquidityUSD = new BigNumber(liquidityInfo.token0USD).plus(liquidityInfo.token1USD).toFixed()

    liquidityInfo.collectToken0 = new BigNumber(collect.amount0).div(10 ** token0.decimals).toFixed(token0.decimals, BigNumber.ROUND_DOWN)
    liquidityInfo.collectToken1 = new BigNumber(collect.amount1).div(10 ** token1.decimals).toFixed(token1.decimals, BigNumber.ROUND_DOWN)
    liquidityInfo.collectToken0USD = new BigNumber(token0Price.priceUSD).multipliedBy(liquidityInfo.collectToken0).toFixed()
    liquidityInfo.collectToken1USD = new BigNumber(token1Price.priceUSD).multipliedBy(liquidityInfo.collectToken1).toFixed()
    liquidityInfo.collectUSD = new BigNumber(liquidityInfo.collectToken0USD).plus(liquidityInfo.collectToken1USD).toFixed()

    liquidityInfo.histories = liquidityHistory

    liquidityInfo.apr = Number.parseFloat(liquidityInfo.liquidityUSD) <= 0
      ? '0'
      : liquidityHistory.filter(it => it.type === 'collect_fee')
        .map(it => new BigNumber(token0Price.priceUSD).multipliedBy(it.token0Amount).plus(new BigNumber(token0Price.priceUSD).multipliedBy(it.token1Amount)).toFixed())
        .reduce((a, b) => new BigNumber(a).plus(b), new BigNumber('0'))
        .plus(liquidityInfo.collectToken0USD)
        .plus(liquidityInfo.collectToken1USD)
        .div(liquidityInfo.liquidityUSD)
        .multipliedBy(100)
        .toFixed()

    liquidityInfo.collectFee = async (connect: ConnectInfo, involvesMNT: boolean): Promise<TransactionEvent> => {
      const transactionEvent = await connect.create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
        .collect(
          tokenId,
          token0,
          token1,
          collect.amount0,
          collect.amount1,
          involvesMNT,
        )
      transactionHistory.saveHistory(
        connectInfo,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: collect.amount0,
          token1Amount: collect.amount1,
          type: 'collect_fee',
          to: undefined,
        },
      )

      return transactionEvent
    }

    liquidityInfo.preRemoveLiquidity = (rate: string) => {
      if (new BigNumber(rate).comparedTo('0') <= 0 || new BigNumber(rate).comparedTo('1') > 0)
        throw new BasicException('rate is zero')

      const positionDetail = new Position({
        pool,
        liquidity: new BigNumber(position.liquidity).multipliedBy(rate).toFixed(0, BigNumber.ROUND_DOWN),
        tickLower: Number.parseInt(position.tickLower),
        tickUpper: Number.parseInt(position.tickUpper),
      })

      const amount0 = positionDetail.amount0.toFixed()
      const amount1 = positionDetail.amount1.toFixed()
      return {
        amount0,
        amount1,
      }
    }

    liquidityInfo.removeLiquidity = async (connect: ConnectInfo, rate: string, involvesMNT: boolean, allowedSlippage: string, deadline: number | string): Promise<TransactionEvent> => {
      const preRemoveLiquidity = liquidityInfo.preRemoveLiquidity(rate)
      const positionDetail = new Position({
        pool,
        liquidity: new BigNumber(position.liquidity).multipliedBy(rate).toFixed(0, BigNumber.ROUND_DOWN),
        tickLower: Number.parseInt(position.tickLower),
        tickUpper: Number.parseInt(position.tickUpper),
      })
      const transactionEvent = await connect.create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
        .removeLiquidity(
          rate,
          token0,
          token1,
          positionDetail,
          tokenId,
          collect.amount0,
          collect.amount1,
          involvesMNT,
          new Percent(BigInt(new BigNumber(allowedSlippage).multipliedBy(10000).toFixed(0, BigNumber.ROUND_DOWN)), 10000n),
          Number.parseInt(String(new Date().getTime() / 1000)) + Number.parseInt(deadline.toString()),
        )

      transactionHistory.saveHistory(
        connectInfo,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: preRemoveLiquidity.amount0,
          token1Amount: preRemoveLiquidity.amount1,
          type: 'remove',
          to: undefined,
        },
      )
      return transactionEvent
    }

    liquidityInfo.preAddLiquidity = (inputToken: Token, inputAmount: string) => {
      if (!isNumber(inputAmount))
        throw new BasicException('Amount Incorrect')

      const outAmount = this.outputTokenAmount(pool, inputToken, inputAmount, Number.parseInt(position.tickLower), Number.parseInt(position.tickUpper))
      if (token0.equals(inputToken)) {
        return {
          amount0: inputAmount,
          amount1: outAmount,
        }
      }
      else {
        return {
          amount0: outAmount,
          amount1: inputAmount,
        }
      }
    }
    liquidityInfo.addLiquidity = async (connect: ConnectInfo, amount0: string, amount1: string, allowedSlippage: string, deadline: string | number): Promise<TransactionEvent> => {
      if (!isNumber(amount0) || !isNumber(amount1))
        throw new BasicException('Amount Incorrect')

      const nextPosition = Position.fromAmounts({
        pool,
        tickLower: Number.parseInt(position.tickLower),
        tickUpper: Number.parseInt(position.tickUpper),
        amount0: new BigNumber(amount0).multipliedBy(10 ** token0.decimals).toFixed(),
        amount1: new BigNumber(amount1).multipliedBy(10 ** token1.decimals).toFixed(),
        useFullPrecision: true, // we want full precision for the theoretical position
      })
      const slippageTolerance = new Percent(BigInt(new BigNumber(allowedSlippage).multipliedBy(10000).toFixed(0, BigNumber.ROUND_DOWN)), 10000n)
      const deadlineReal = Number.parseInt(String(new Date().getTime() / 1000)) + Number.parseInt(deadline.toString())
      const transactionEvent = await connect.create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
        .addLiquidity(nextPosition, tokenId, false, slippageTolerance, deadlineReal)

      transactionHistory.saveHistory(
        connectInfo,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: amount0,
          token1Amount: amount1,
          type: 'add',
          to: undefined,
        },
      )
      return transactionEvent
    }

    return liquidityInfo
  }

  async collectFeeData(tokenId: string, account: string): Promise<{
    amount0: string
    amount1: string
  }> {
    const nonfungiblePositionManager = this.baseApi.connectInfo().create(NonfungiblePositionManagerContract, this.baseApi.address().nonfungiblePositionManager)
    const MAX_UINT128 = 2n ** 128n - 1n
    const collect = { amount0: '0', amount1: '0' }

    try {
      const collectResult = await nonfungiblePositionManager.contract.collect.staticCall({
        tokenId,
        recipient: account, // some tokens might fail if transferred to address(0)
        amount0Max: MAX_UINT128,
        amount1Max: MAX_UINT128,
      }, { from: account })
      collect.amount0 = collectResult.amount0
      collect.amount1 = collectResult.amount1
    }
    catch (e) {
      Trace.error('ignore collect error', e)
    }
    return collect
  }

  async feeTierDistribution(token0: Token, token1: Token): Promise<Record<FeeAmount, number>> {
    const result = await this.baseApi.exchangeV3Graph<any>(FeeTierDistributionGQL, {
      token0: token0.erc20Address().toLowerCase(),
      token1: token1.erc20Address().toLowerCase(),
    })

    const { asToken0, asToken1, _meta } = result
    const all = asToken0.concat(asToken1)

    // sum tvl for token0 and token1 by fee tier
    const tvlByFeeTier = all.reduce(
      (acc: any, value: any) => {
        // We can safely remove the `[value.feeTier]?.` after we update ethereum fee tier

        acc[value.feeTier][0] = (acc[value.feeTier][0] ?? 0) + Number(value.totalValueLockedToken0)

        acc[value.feeTier][1] = (acc[value.feeTier][1] ?? 0) + Number(value.totalValueLockedToken1)
        return acc
      },
      {
        [FeeAmount.LOWEST]: [undefined, undefined],
        [FeeAmount.LOW]: [undefined, undefined],
        [FeeAmount.MEDIUM]: [undefined, undefined],
        [FeeAmount.HIGH]: [undefined, undefined],
      },
    )

    // sum total tvl for token0 and token1
    const reduce = Object.values(tvlByFeeTier).reduce(
      (acc: [number, number], value: any) => {
        const result = acc
        result[0] += (value[0] || 0)
        result[1] += (value[1] || 0)
        return result
      },
      [0, 0],
    )
    const [sumToken0Tvl, sumToken1Tvl]: [number, number] = reduce as any

    // returns undefined if both tvl0 and tvl1 are undefined (pool not created)
    const mean = (tvl0: number | undefined, sumTvl0: number, tvl1: number | undefined, sumTvl1: number) => tvl0 === undefined && tvl1 === undefined ? undefined : ((tvl0 ?? 0) + (tvl1 ?? 0)) / (sumTvl0 + sumTvl1) || 0

    const distributions: Record<FeeAmount, number | undefined> = {
      [FeeAmount.LOWEST]: mean(
        tvlByFeeTier[FeeAmount.LOWEST][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.LOWEST][1],
        sumToken1Tvl,
      ),
      [FeeAmount.LOW]: mean(tvlByFeeTier[FeeAmount.LOW][0], sumToken0Tvl, tvlByFeeTier[FeeAmount.LOW][1], sumToken1Tvl),
      [FeeAmount.MEDIUM]: mean(
        tvlByFeeTier[FeeAmount.MEDIUM][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.MEDIUM][1],
        sumToken1Tvl,
      ),
      [FeeAmount.HIGH]: mean(
        tvlByFeeTier[FeeAmount.HIGH][0],
        sumToken0Tvl,
        tvlByFeeTier[FeeAmount.HIGH][1],
        sumToken1Tvl,
      ),
    }
    return distributions
  }

  async allTickInfo(token0: Token, token1: Token, feeAmount: FeeAmount): Promise<{
    tickDatas: TickData[]
    ticksProcessed: TickProcessed[]
  }> {
    const pools = await this.getPool([{ token0, token1, feeAmount }])
    const poolAddress = PoolV3Api.computePoolAddress(token0, token1, feeAmount)
    const pool = pools[0]
    const tickDatas: TickData[] = []
    let lastTick = TickMath.MIN_TICK - 1
    while (true) {
      const { ticks } = await this.baseApi.exchangeV3Graph<{
        ticks: TickData[]
      }>(AllV3TicksGQL, {
        poolAddress: poolAddress.toLowerCase(),
        lastTick: Number(lastTick),
        pageSize: 1000,
      })

      if (ticks.length === 0)
        break

      lastTick = ticks[ticks.length - 1].tick
      tickDatas.push(...ticks)
    }
    const activeTick = pool ? Math.floor(pool.tickCurrent / TICK_SPACINGS[feeAmount]) * TICK_SPACINGS[feeAmount] : undefined
    const pivot = tickDatas.findIndex(({ tick }) => Number(tick) > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      Trace.error('TickData pivot not found')
      return {
        tickDatas,
        ticksProcessed: [],
      }
    }
    const activeTickProcessed: TickProcessed = {
      liquidityActive: pool.liquidity,
      tick: activeTick,
      liquidityNet: Number(tickDatas[pivot].tick) === activeTick ? BigInt(tickDatas[pivot].liquidityNet) : 0n,
      price0: tickToPrice(token0, token1, activeTick).toFixed(),
    }
    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, tickDatas, pivot, true)
    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, tickDatas, pivot, false)
    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)
    return {
      tickDatas,
      ticksProcessed,
    }
  }

  public static computePoolAddress(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
  ): string {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
    const currentAddressInfo = getCurrentAddressInfo()
    const poolInitCodeHash = currentAddressInfo.initCodeHash
    const agniPoolDeployer = currentAddressInfo.agniPoolDeployer
    const encodedParams = AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint24'],
      [token0.erc20Address(), token1.erc20Address(), fee],
    )
    const salt = solidityPackedKeccak256(['bytes'], [encodedParams])
    return getCreate2Address(
      agniPoolDeployer,
      salt,
      poolInitCodeHash,
    )
  }

  async getPool(datas: {
    token0: Token
    token1: Token
    feeAmount: FeeAmount
  }[]): Promise<(Pool | undefined)[]> {
    const connectInfo = this.baseApi.connectInfo()
    const poolDatas = await connectInfo.multiCall().call(
      ...datas.map((data) => {
        const address = PoolV3Api.computePoolAddress(data.token0, data.token1, data.feeAmount)
        const poolV3 = connectInfo.create(PoolV3Contract, address)
        return {
          address,
          slot0: poolV3.mulContract.slot0(),
          liquidity: poolV3.mulContract.liquidity(),
        }
      }),
    )
    return poolDatas.map((poolData, index) => {
      const {
        slot0,
        liquidity,
      } = poolData
      if (!slot0 || !liquidity)
        return undefined

      const { sqrtPriceX96, tick } = slot0
      if (!sqrtPriceX96 || sqrtPriceX96 === '0')
        return undefined
      return new Pool(datas[index].token0, datas[index].token1, datas[index].feeAmount, sqrtPriceX96, liquidity, tick)
    })
  }

  private parsePrice(token0: Token, token1: Token, inputFirstPrice: string): Price<Token, Token> {
    const baseAmount = CurrencyAmount.fromRawAmount(token0, BigInt(new BigNumber('1').multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN)))
    const parsedQuoteAmount = CurrencyAmount.fromRawAmount(token1, BigInt(new BigNumber(inputFirstPrice).multipliedBy(10 ** token1.decimals).toFixed(0, BigNumber.ROUND_DOWN)))
    return new Price(
      baseAmount.currency,
      parsedQuoteAmount.currency,
      baseAmount.quotient,
      parsedQuoteAmount.quotient,
    )
  }

  // 获取输出币种金额
  private outputTokenAmount(pool: Pool, inputToken: Token, inputAmount: string, tickLower: number | undefined, tickUpper: number | undefined) {
    const independentAmount = CurrencyAmount.fromRawAmount(inputToken, BigInt(new BigNumber(inputAmount).multipliedBy(10 ** inputToken.decimals).toFixed(0, BigNumber.ROUND_DOWN)))
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = inputToken.equals(pool.token0) ? pool.token1 : pool.token0
    if (
      independentAmount
      && wrappedIndependentAmount
      && typeof tickLower === 'number'
      && typeof tickUpper === 'number'
      && pool
    ) {
      const position: Position | undefined = wrappedIndependentAmount.currency.equals(pool.token0)
        ? Position.fromAmount0({
          pool,
          tickLower,
          tickUpper,
          amount0: independentAmount.quotient,
          useFullPrecision: true, // we want full precision for the theoretical position
        })
        : Position.fromAmount1({
          pool,
          tickLower,
          tickUpper,
          amount1: independentAmount.quotient,
        })

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(pool.token0)
        ? position.amount1
        : position.amount0
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient).toFixed()
    }
    return ''
  }

  // useV3DerivedInfo
  async addLiquidity(token0: Token, token1: Token, account: string): Promise<AddLiquidityV3Info> {
    const addLiquidityV3Info = new AddLiquidityV3Info()
    addLiquidityV3Info.token0 = token0
    addLiquidityV3Info.token1 = token1
    addLiquidityV3Info.feeAmount = FeeAmount.MEDIUM
    addLiquidityV3Info.token0Amount = ''
    addLiquidityV3Info.token1Amount = ''
    addLiquidityV3Info.firstPrice = ''
    addLiquidityV3Info.first = false
    addLiquidityV3Info.token0Balance = BalanceAndAllowance.unavailable(token0)
    addLiquidityV3Info.token1Balance = BalanceAndAllowance.unavailable(token1)

    const feeAmounts = [
      FeeAmount.LOWEST,
      FeeAmount.LOW,
      FeeAmount.MEDIUM,
      FeeAmount.HIGH,
    ]

    const reset = () => {
      addLiquidityV3Info.token0Amount = ''
      addLiquidityV3Info.token1Amount = ''
      addLiquidityV3Info.tickLower = undefined
      addLiquidityV3Info.tickUpper = undefined
      addLiquidityV3Info.firstPrice = undefined
      addLiquidityV3Info.minPrice = undefined
      addLiquidityV3Info.maxPrice = undefined
      addLiquidityV3Info.rate = undefined
      addLiquidityV3Info.tickData = undefined
    }

    if (account) {
      const balanceAndAllowances = await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(
        account,
        this.baseApi.address().nonfungiblePositionManager,
        [token0, token1],
      )
      addLiquidityV3Info.token0Balance = balanceAndAllowances[token0.address]
      addLiquidityV3Info.token1Balance = balanceAndAllowances[token1.address]
    }

    const [poolDatas, feeTierDistribution] = await Promise.all([
      this.getPool(
        feeAmounts.map((feeAmount) => {
          return {
            token0,
            token1,
            feeAmount,
          }
        }),
      ),
      this.feeTierDistribution(token0, token1),
    ])
    addLiquidityV3Info.poolState = feeAmounts.map((feeAmount, index) => {
      return {
        feeAmount,
        pick: feeTierDistribution[feeAmount] || 0,
        state: poolDatas[index] ? 'create' : 'no create',
      }
    })

    addLiquidityV3Info.checkFirstPrice = (inputFirstPrice: string) => {
      if (!addLiquidityV3Info.first || !isNumber(inputFirstPrice))
        return false

      const price = this.parsePrice(token0, token1, inputFirstPrice)
      Trace.print('price', price.toFixed(), price.invert().toFixed())
      const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)
      return price && sqrtRatioX96 && (BigInt(sqrtRatioX96) >= TickMath.MIN_SQRT_RATIO && BigInt(sqrtRatioX96) < TickMath.MAX_SQRT_RATIO)
    }

    addLiquidityV3Info.updateFirstPrice = async (inputFirstPrice) => {
      if (addLiquidityV3Info.first) {
        if (addLiquidityV3Info.checkFirstPrice(inputFirstPrice)) {
          addLiquidityV3Info.firstPrice = new BigNumber(inputFirstPrice).toFixed(token0.decimals, BigNumber.ROUND_DOWN)
          const currentTick = priceToClosestTick(this.parsePrice(token0, token1, inputFirstPrice))
          const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
          addLiquidityV3Info.pool = new Pool(addLiquidityV3Info.token0, addLiquidityV3Info.token1, addLiquidityV3Info.feeAmount, currentSqrt, 0n, currentTick, [])
        }
      }
    }

    addLiquidityV3Info.updateToken0 = (amount) => {
      const tokenAmount = this.outputTokenAmount(addLiquidityV3Info.pool, token0, amount, addLiquidityV3Info.tickLower, addLiquidityV3Info.tickUpper)
      addLiquidityV3Info.token0Amount = amount
      addLiquidityV3Info.token1Amount = tokenAmount
      return tokenAmount
    }
    addLiquidityV3Info.updateToken1 = (amount) => {
      const tokenAmount = this.outputTokenAmount(addLiquidityV3Info.pool, token1, amount, addLiquidityV3Info.tickLower, addLiquidityV3Info.tickUpper)
      addLiquidityV3Info.token1Amount = amount
      addLiquidityV3Info.token0Amount = tokenAmount
      return tokenAmount
    }

    addLiquidityV3Info.updateFeeAmount = (feeAmount) => {
      reset()
      addLiquidityV3Info.feeAmount = feeAmount
      const pool = poolDatas[feeAmounts.indexOf(feeAmount)]
      if (!pool) {
        addLiquidityV3Info.first = true
      }
      else {
        addLiquidityV3Info.first = false
        addLiquidityV3Info.firstPrice = pool.priceOf(addLiquidityV3Info.token0).toFixed()
        addLiquidityV3Info.pool = pool
      }
    }

    const updateToken = () => {
      if (isNumber(addLiquidityV3Info.token0Amount) && new BigNumber(addLiquidityV3Info.token0Amount).comparedTo('0') > 0) {
        addLiquidityV3Info.updateToken0(addLiquidityV3Info.token0Amount)
        return
      }

      if (isNumber(addLiquidityV3Info.token1Amount) && new BigNumber(addLiquidityV3Info.token1Amount).comparedTo('0') > 0)
        addLiquidityV3Info.updateToken1(addLiquidityV3Info.token1Amount)
    }

    addLiquidityV3Info.setPriceRange = (leftRangeTypedValue: string | boolean, rightRangeTypedValue: string | boolean) => {
      const [tokenA, tokenB] = token0.sortsBefore(token1)
        ? [token0, token1]
        : [token1, token0]
      const invertPrice = Boolean(!tokenA.equals(token0))
      const lower = (invertPrice && typeof rightRangeTypedValue === 'boolean')
      || (!invertPrice && typeof leftRangeTypedValue === 'boolean')
        ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[addLiquidityV3Info.feeAmount])
        : invertPrice
          ? tryParseTick(tokenB, tokenA, addLiquidityV3Info.feeAmount, rightRangeTypedValue.toString())
          : tryParseTick(tokenA, tokenB, addLiquidityV3Info.feeAmount, leftRangeTypedValue.toString())

      const upper = (!invertPrice && typeof rightRangeTypedValue === 'boolean')
      || (invertPrice && typeof leftRangeTypedValue === 'boolean')
        ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[addLiquidityV3Info.feeAmount])
        : invertPrice
          ? tryParseTick(tokenB, tokenA, addLiquidityV3Info.feeAmount, leftRangeTypedValue.toString())
          : tryParseTick(tokenA, tokenB, addLiquidityV3Info.feeAmount, rightRangeTypedValue.toString())

      addLiquidityV3Info.tickLower = lower
      addLiquidityV3Info.tickUpper = upper
      addLiquidityV3Info.minPrice = tickToPriceString(token0, token1, addLiquidityV3Info.feeAmount, invertPrice ? upper : lower)
      addLiquidityV3Info.maxPrice = tickToPriceString(token0, token1, addLiquidityV3Info.feeAmount, invertPrice ? lower : upper)

      if (new BigNumber(addLiquidityV3Info.minPrice).comparedTo(addLiquidityV3Info.firstPrice) > 0)
        addLiquidityV3Info.token1Amount = '0'

      if (addLiquidityV3Info.maxPrice !== '∞' && new BigNumber(addLiquidityV3Info.maxPrice).comparedTo(addLiquidityV3Info.firstPrice) < 0)
        addLiquidityV3Info.token0Amount = '0'

      updateToken()
      return {
        minPrice: addLiquidityV3Info.minPrice,
        maxPrice: addLiquidityV3Info.maxPrice,
      }
    }

    addLiquidityV3Info.setRate = (rate: '10' | '20' | '50' | 'full') => {
      if (addLiquidityV3Info.firstPrice) {
        let minPrice: string | boolean = true
        let maxPrice: string | boolean = true
        if (rate !== 'full') {
          minPrice = new BigNumber(addLiquidityV3Info.firstPrice).multipliedBy((1 - Number(rate) / 100)).toFixed()
          maxPrice = new BigNumber(addLiquidityV3Info.firstPrice).multipliedBy((1 + Number(rate) / 100)).toFixed()
        }
        const priceRange = addLiquidityV3Info.setPriceRange(minPrice, maxPrice)
        addLiquidityV3Info.rate = rate
        return priceRange
      }
      else {
        return {
          minPrice: addLiquidityV3Info.minPrice,
          maxPrice: addLiquidityV3Info.maxPrice,
        }
      }
    }

    addLiquidityV3Info.addLiquidity = async (connect: ConnectInfo, allowedSlippage: string, deadline: string | number) => {
      const nonfungiblePositionManager = connect.create(NonfungiblePositionManagerContract)
      if (
        !addLiquidityV3Info.pool
        || !addLiquidityV3Info.token0Amount
        || !addLiquidityV3Info.token1Amount
        || typeof addLiquidityV3Info.tickLower !== 'number'
        || typeof addLiquidityV3Info.tickUpper !== 'number'
        || addLiquidityV3Info.tickLower >= addLiquidityV3Info.tickUpper
      )
        throw new Error('invalid input')

      // mark as 0 if disabled because out of range
      const realToken0Amount = new BigNumber(addLiquidityV3Info.token0Amount).multipliedBy(10 ** addLiquidityV3Info.token0.decimals).toFixed(0, BigNumber.ROUND_DOWN)
      const realToken1Amount = new BigNumber(addLiquidityV3Info.token1Amount).multipliedBy(10 ** addLiquidityV3Info.token1.decimals).toFixed(0, BigNumber.ROUND_DOWN)
      const amount0 = addLiquidityV3Info.pool.tickCurrent <= addLiquidityV3Info.tickUpper
        ? addLiquidityV3Info.pool.token0.equals(addLiquidityV3Info.token0) ? realToken0Amount : realToken1Amount
        : 0n
      const amount1 = addLiquidityV3Info.pool.tickCurrent >= addLiquidityV3Info.tickLower
        ? addLiquidityV3Info.pool.token0.equals(addLiquidityV3Info.token0) ? realToken1Amount : realToken0Amount
        : 0n
      const position = Position.fromAmounts({
        pool: addLiquidityV3Info.pool,
        tickLower: addLiquidityV3Info.tickLower,
        tickUpper: addLiquidityV3Info.tickUpper,
        amount0,
        amount1,
        useFullPrecision: true,
      })
      const slippageTolerance = new Percent(BigInt(new BigNumber(allowedSlippage).multipliedBy(10000).toFixed(0, BigNumber.ROUND_DOWN)), 10000n)
      const deadlineReal = Number.parseInt(String(new Date().getTime() / 1000)) + Number.parseInt(deadline.toString())
      const transactionEvent = await nonfungiblePositionManager.addLiquidity(position, undefined, addLiquidityV3Info.first, slippageTolerance, deadlineReal)
      transactionHistory.saveHistory(
        connect,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: realToken0Amount,
          token1Amount: realToken1Amount,
          type: 'add',
          to: undefined,
        },
      )

      return transactionEvent
    }

    addLiquidityV3Info.updateAllTickInfo = async () => {
      if (addLiquidityV3Info.tickData)
        return addLiquidityV3Info.tickData

      // 防止异步更新的问题
      while (true) {
        const feeAmount = addLiquidityV3Info.feeAmount
        const result = await this.allTickInfo(token0, token1, feeAmount)
        if (feeAmount === addLiquidityV3Info.feeAmount) {
          addLiquidityV3Info.tickData = result
          return result
        }
      }
    }

    // 初始化
    addLiquidityV3Info.updateFeeAmount(addLiquidityV3Info.feeAmount)
    if (!addLiquidityV3Info.first)
      addLiquidityV3Info.setRate('50')

    await addLiquidityV3Info.updateAllTickInfo()
    return addLiquidityV3Info
  }
}
