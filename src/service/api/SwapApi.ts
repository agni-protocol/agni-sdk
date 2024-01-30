import BigNumber from 'bignumber.js'
import {
  BalanceAndAllowance,
  ETH_ADDRESS,
  SwapConfig,
  SwapInfo, SwapTokenPriceHistoryAll,
  SwapTokenPriceType,
  TransactionEvent,
  UpdateInputResult
} from '../vo'
import {
  CacheKey,
  CurrencyAmount,
  generatePriceLine,
  isNullOrUndefined,
  mixProxy,
  Percent, TimeUtils,
  Token,
  Trace,
  TradeType
} from '../tool'
import {computeTradePriceBreakdown} from '../tool/math/SwapV3Math'
import {getBestTrade} from '../tool/v3route/getBestTrade'
import type {ConnectInfo} from '../../ConnectInfo'
import {SwapRouterContract} from '../abi/SwapRouterContract'
import {getCurrentAddressInfo} from '../../Constant'
import {RUSDYContract, WETHContract} from '../abi'
import groupBy from 'lodash/groupBy'
import get from 'lodash/get'
import type {GetDerivedPricesGQLResult} from './gql/SwapV3Gql'
import {GetDerivedPricesGQL} from './gql/SwapV3Gql'
import type {BaseApi} from './BaseApi'
import {BASE_API} from './BaseApi'
import {transactionHistory} from './TransactionHistory'
import {SubGraphPoolProvider} from "./provider/SubGraphPoolProvider";
import {V3QuoteProvider} from "./provider/V3QuoteProvider";
import {GetTokenPriceDataGQL, GetTokenPriceDataType} from "./gql/DashboardGql";


@CacheKey('SwapApi')
export class SwapApi {
  public baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }


  async swapInfo(token0: Token, token1: Token, account: string): Promise<SwapInfo> {
    const swapInfo = new SwapInfo()
    swapInfo.version = 0;
    swapInfo.token0 = token0
    swapInfo.token1 = token1
    swapInfo.isWrap = false
    swapInfo.updateInputResult = {
      canSwap: false,
    } as UpdateInputResult

    if (token0.address === ETH_ADDRESS && token1.address === getCurrentAddressInfo().WMNT) {
      swapInfo.isWrap = true
      swapInfo.wrapType = 'wrap'
    }
    if (token1.address === ETH_ADDRESS && token0.address === getCurrentAddressInfo().WMNT) {
      swapInfo.isWrap = true
      swapInfo.wrapType = 'unwrap'
    }
    if (token1.address === getCurrentAddressInfo().RUSDY && token0.address === getCurrentAddressInfo().USDY) {
      swapInfo.isWrap = true
      swapInfo.wrapType = 'wrap'
    }
    if (token0.address === getCurrentAddressInfo().RUSDY && token1.address === getCurrentAddressInfo().USDY) {
      swapInfo.isWrap = true
      swapInfo.wrapType = 'unwrap'
    }

    swapInfo.token0Balance = BalanceAndAllowance.unavailable(token0)
    swapInfo.token1Balance = BalanceAndAllowance.unavailable(token1)

    const initBalance = async () => {
      if (account) {
        const balanceAndAllowances = await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(
          account,
          this.baseApi.address().swapRouter,
          [token0, token1],
        )
        swapInfo.token0Balance = balanceAndAllowances[token0.address]
        swapInfo.token1Balance = balanceAndAllowances[token1.address]
      }
    }
    const initTokenUsdPrice = async () => {
      const tokenPrices = await this.baseApi.address().getApi().tokenMangerApi().tokenPrice(token0, token1)
      swapInfo.token0Price = tokenPrices[0]
      swapInfo.token1Price = tokenPrices[1]
    }

    await Promise.all([initBalance(), initTokenUsdPrice()])

    const swapByRoute = async (inputToken: Token, inputAmount: string, swapConfig: SwapConfig,reload:boolean) => {
      const updateResult:UpdateInputResult = {
        ...swapInfo.updateInputResult,
      }

      try {
        if (!reload){
          updateResult.trade = undefined
          updateResult.canSwap = false
          updateResult.swapConfig = swapConfig
        }

        const routerTrade = await this.getBestTrade(
          swapInfo.token0,
          swapInfo.token1,
          inputAmount,
          inputToken,
          swapConfig,
        )
        updateResult.canSwap = true
        updateResult.trade = routerTrade
        updateResult.intputToken = inputToken
        updateResult.inputAmount = inputAmount

        if (swapInfo.token1.equals(inputToken)) {
          updateResult.token0Amount = routerTrade.inputAmount.toFixed()
          updateResult.token1Amount = inputAmount
          updateResult.maximumSold = new BigNumber(updateResult.token0Amount).multipliedBy(1 + Number.parseFloat(swapConfig.allowedSlippage)).toFixed()
          updateResult.minimumReceived = undefined
        } else {
          updateResult.token0Amount = inputAmount
          updateResult.token1Amount = routerTrade.outputAmount.toFixed()
          updateResult.minimumReceived = new BigNumber(updateResult.token1Amount).multipliedBy(1 - Number.parseFloat(swapConfig.allowedSlippage)).toFixed()
          updateResult.maximumSold = undefined
        }

        updateResult.token0SwapPrice = new BigNumber(updateResult.token1Amount).div(updateResult.token0Amount).toFixed()
        updateResult.token1SwapPrice = new BigNumber(updateResult.token0Amount).div(updateResult.token1Amount).toFixed()
        const computeTradePrice = computeTradePriceBreakdown(routerTrade)
        updateResult.tradingFee = computeTradePrice.lpFeeAmount?.toFixed()
        updateResult.priceImpact = computeTradePrice.priceImpactWithoutFee?.toFixed()
      } catch (e) {
        Trace.error("ERROR", e)
        updateResult.canSwap = false
        updateResult.intputToken = undefined
        updateResult.inputAmount = undefined
        updateResult.tradingFee = undefined
        updateResult.minimumReceived = undefined
        updateResult.maximumSold = undefined
      }
      swapInfo.updateInputResult = updateResult
    }

    const swapByWrap = async (inputToken: Token, inputAmount: string,reload:boolean) => {
      const updateResult:UpdateInputResult = {
        ...swapInfo.updateInputResult,
      }
      try {
        if (!reload){
          updateResult.canSwap = false
        }
        updateResult.intputToken = inputToken
        updateResult.inputAmount = inputAmount
        updateResult.token0Amount = inputAmount
        if (swapInfo.wrapType === 'wrap') {
          if (token0.address === ETH_ADDRESS)
            updateResult.token1Amount = inputAmount

          if (token0.address === getCurrentAddressInfo().USDY)
            updateResult.token1Amount = await this.baseApi.connectInfo().create(RUSDYContract).getRUSDYByShares(inputAmount)
        }
        if (swapInfo.wrapType === 'unwrap') {
          if (token1.address === ETH_ADDRESS)
            updateResult.token1Amount = inputAmount

          if (token1.address === getCurrentAddressInfo().USDY)
            updateResult.token1Amount = await this.baseApi.connectInfo().create(RUSDYContract).getRUSDYByShares(inputAmount)
        }
        updateResult.canSwap = true
      } catch (e) {
        Trace.error(e)
        updateResult.canSwap = false
        updateResult.intputToken = undefined
        updateResult.inputAmount = undefined
      }
      swapInfo.updateInputResult = updateResult
    }


    const updateInput = async (inputToken: Token, inputAmount: string, swapConfig: SwapConfig,reload:boolean) => {
      if (swapInfo.isWrap) {
        if (inputToken.address === token0.address)
          await swapByWrap(inputToken, inputAmount, reload)
      } else {
        await swapByRoute(inputToken, inputAmount, swapConfig,reload)
      }
    }

    swapInfo.updateInput = async (inputToken: Token, inputAmount: string, swapConfig: SwapConfig) => {
       await updateInput(inputToken, inputAmount, swapConfig,false)
       return swapInfo.updateInputResult
    }

    swapInfo.swap = async (connectInfo: ConnectInfo, recipientAddr: string | undefined, deadline: string | number) => {
      const updateInputResult = swapInfo.updateInputResult;
      if (!updateInputResult.canSwap)
        return

      if (isNullOrUndefined(recipientAddr))
        recipientAddr = connectInfo.account

      const slippageTolerance = new Percent(BigInt(new BigNumber(updateInputResult.swapConfig.allowedSlippage).multipliedBy(10000).toFixed(0, BigNumber.ROUND_DOWN)), 10000n)
      const transactionEvent = await connectInfo.create(SwapRouterContract).swap([updateInputResult.trade], slippageTolerance, recipientAddr, deadline, updateInputResult.swapConfig.gasPriceWei)
      transactionHistory.saveHistory(
        connectInfo,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: updateInputResult.token0Amount,
          token1Amount: updateInputResult.token1Amount,
          type: 'swap',
          to: recipientAddr,
        },
      )
      return transactionEvent
    }
    swapInfo.wrap = async (connectInfo: ConnectInfo) => {
      const updateInputResult = swapInfo.updateInputResult;
      let transactionEvent: TransactionEvent | undefined
      if (swapInfo.wrapType === 'wrap') {
        if (token0.address === ETH_ADDRESS)
          transactionEvent = await connectInfo.create(WETHContract).deposit(new BigNumber(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN))

        if (token0.address === getCurrentAddressInfo().USDY)
          transactionEvent = await connectInfo.create(RUSDYContract).wrap(new BigNumber(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN))
      }
      if (swapInfo.wrapType === 'unwrap') {
        if (token1.address === ETH_ADDRESS)
          transactionEvent = await connectInfo.create(WETHContract).withdraw(new BigNumber(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN))

        if (token1.address === getCurrentAddressInfo().USDY)
          transactionEvent = await connectInfo.create(RUSDYContract).unwrap(new BigNumber(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, BigNumber.ROUND_DOWN))
      }
      if (transactionEvent === undefined)
        throw new Error('wrap type error')

      transactionHistory.saveHistory(
        connectInfo,
        transactionEvent,
        {
          token0,
          token1,
          token0Amount: updateInputResult.token0Amount,
          token1Amount: updateInputResult.token1Amount,
          type: 'swap',
          to: undefined,
        },
      )
      return transactionEvent
    }

    swapInfo.update = async () => {
      await initBalance()
      await initTokenUsdPrice()
      const updateInputResult = swapInfo.updateInputResult;
      if (updateInputResult.canSwap)
        await updateInput(updateInputResult.intputToken, updateInputResult.inputAmount, updateInputResult.swapConfig,true)
    }

    swapInfo.getTokenPrice = async (type: SwapTokenPriceType) => {
      return await this.getTokenPrice(type,swapInfo)
    }
    return swapInfo
  }


  private async getTokenPrice(type: SwapTokenPriceType,swapInfo:SwapInfo){
    swapInfo.tokenPriceType = type
    swapInfo.tokenPrice = undefined
    const token0 = swapInfo.token0
    const token1 = swapInfo.token1

    if (swapInfo.isWrap)
      return

    const getTimeConfig = (type: SwapTokenPriceType) => {
      const endTime = Number.parseInt(String(new Date().getTime() / 1000))
      const  dayTimeInterval = 60 * 60 * 24
      const  hourTimeInterval = 60 * 60
      switch (type) {
        case 'day':
          return {
            hour: true,
            endTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval,
            interval: hourTimeInterval,
            startTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval - 24 * hourTimeInterval,
          }
        case 'week':
          return {
            hour: true,
            endTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval,
            interval: hourTimeInterval,
            startTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval - 7 * 24 * hourTimeInterval,
          }
        case 'month':
          return {
            hour: false,
            interval: dayTimeInterval,
            endTime:   parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval,
            startTime:  parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval - 30 * dayTimeInterval,
          }
        case 'year':
          return {
            hour: false,
            interval: dayTimeInterval,
            endTime:  parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval,
            startTime:  parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval - 365 * dayTimeInterval,
          }
      }
    }

    const timeConfig = getTimeConfig(type)
    const timestamps: number[] = []
    {
      let time = timeConfig.startTime
      while (time <= timeConfig.endTime) {
        timestamps.push(time)
        time += timeConfig.interval
      }
    }

    /*if (type === 'day' || type === 'week'){
      const blocks = await this.baseApi.address().getApi().dashboard().getBlocksFromTimestamps(timestamps, 'exchange-v3')

      const [
        token0Prices,
        token1Prices,
      ] = await Promise.all(
        [
          this.baseApi.exchangeV3Graph<GetDerivedPricesGQLResult>(GetDerivedPricesGQL(token0.erc20Address().toLowerCase(), blocks), {}),
          this.baseApi.exchangeV3Graph<GetDerivedPricesGQLResult>(GetDerivedPricesGQL(token1.erc20Address().toLowerCase(), blocks), {}),
        ],
      )

      const token0PriceData: {
        price: string
        time: number
      }[] = []
      const token1PriceData: {
        price: string
        time: number
      }[] = []
      timestamps.forEach((it) => {
        const price0 = token0Prices[`t${it}`]?.derivedUSD
        const price1 = token1Prices[`t${it}`]?.derivedUSD

        if (price0 && price1) {
          token0PriceData.push({
            price: price0 === '0' ? '0' : new BigNumber(price1).div(price0).toFixed(),
            time: it,
          })
          token1PriceData.push({
            price: price1 === '0' ? '0' : new BigNumber(price0).div(price1).toFixed(),
            time: it,
          })
        }
      })
      swapInfo.tokenPrice = {
        token0: {
          datas: token0PriceData,
          lastPrice: token0PriceData[token0PriceData.length - 1]?.price || '0',
        },
        token1: {
          datas: token1PriceData,
          lastPrice: token1PriceData[token1PriceData.length - 1]?.price || '0',
        },
      }
    }*/

    if (type === 'month' || type ==='year' || type === 'day' || type === 'week'){
      const deltaTimestamps = TimeUtils.getDeltaTimestamps()
      const [block24] = await this.baseApi.address().getApi().dashboard().getBlocksFromTimestamps(
        [deltaTimestamps.t24h], 'exchange-v3')


      const [
        token0Prices,
        token1Prices,
        token0Price24,
        token1Price24,
      ] = await Promise.all(
        [
          this.baseApi.exchangeV3Graph<GetTokenPriceDataType>(GetTokenPriceDataGQL(timeConfig.hour,token0.erc20Address().toLowerCase()), {}),
          this.baseApi.exchangeV3Graph<GetTokenPriceDataType>(GetTokenPriceDataGQL(timeConfig.hour,token1.erc20Address().toLowerCase()), {}),
          this.baseApi.exchangeV3Graph<GetDerivedPricesGQLResult>(GetDerivedPricesGQL(token0.erc20Address().toLowerCase(), [block24]), {}),
          this.baseApi.exchangeV3Graph<GetDerivedPricesGQLResult>(GetDerivedPricesGQL(token1.erc20Address().toLowerCase(), [block24]), {}),
        ],
      )

      const price24Token0 = token0Price24[`t${deltaTimestamps.t24h}`]?.derivedUSD
      const price24Token1 = token1Price24[`t${deltaTimestamps.t24h}`]?.derivedUSD

      const token1Price24Rate = price24Token0 && price24Token1 ? new BigNumber(price24Token0).div(price24Token1).toFixed() : '0'
      const token0Price24Rate = price24Token0 && price24Token1 ? new BigNumber(price24Token1).div(price24Token0).toFixed() : '0'


      const token0Kline = generatePriceLine(
        timeConfig.interval,
        new Date().getTime() / 1000,
        500,
        true,
        token0Prices.datas,
      );

      const token1Kline =  generatePriceLine(
        timeConfig.interval,
        new Date().getTime() / 1000,
        500,
        true,
        token1Prices.datas
      )
      const token0PriceData: {
        price: string
        time: number
      }[] = []
      const token1PriceData: {
        price: string
        time: number
      }[] = []

      const token0Group = groupBy(token0Kline,'time');
      const token1Group = groupBy(token1Kline,'time');

      timestamps.forEach((it) => {

        const price0 = get(token0Group, it + '.[0].priceUSD') as any
        const price1 =get(token1Group, it + '.[0].priceUSD')  as any

        if (price0 && price1) {
          token1PriceData.push({
            price: price1 === '0' ? '0' : new BigNumber(price0).div(price1).toFixed(),
            time: it,
          })
          token0PriceData.push({
            price: price0 === '0' ? '0' : new BigNumber(price1).div(price0).toFixed(),
            time: it,
          })
        }
      })
      const token1LastPrice = token1PriceData[token1PriceData.length - 1]?.price || '0'
      const token1Change = new BigNumber(token1LastPrice).minus(token1Price24Rate).toFixed()

      const token0LastPrice = token0PriceData[token0PriceData.length - 1]?.price || '0'
      const token0Change = new BigNumber(token0LastPrice).minus(token0Price24Rate).toFixed()

      swapInfo.tokenPrice =  {
        token0Price: {
          datas: token1PriceData,
          lastPrice: token1PriceData[token1PriceData.length - 1]?.price || '0',
          change24h: parseFloat(token1Price24Rate) <= 0 ? '0' :  new BigNumber(token1LastPrice).minus(token1Price24Rate).div(token1Price24Rate).multipliedBy(100).toFixed(2),
          change: token1Change,
        },
        token1Price:{
          datas: token0PriceData,
          lastPrice: token0PriceData[token0PriceData.length - 1]?.price || '0',
          change24h: parseFloat(token0Price24Rate) <= 0 ? '0' :  new BigNumber(token0LastPrice).minus(token0Price24Rate).div(token0Price24Rate).multipliedBy(100).toFixed(2),
          change: token0Change,
        }
      }as SwapTokenPriceHistoryAll
    }
  }


  private async getBestTrade(
    token0: Token,
    token1: Token,
    amount: string,
    inputToken: Token,
    swapConfig: SwapConfig,
  ) {

    const baseAmount = CurrencyAmount.fromRawAmount(inputToken, BigInt(new BigNumber(amount).multipliedBy(10 ** inputToken.decimals).toFixed(0, BigNumber.ROUND_DOWN)))
    let tradeType = TradeType.EXACT_INPUT
    let token = token1
    if (token1.equals(inputToken)) {
      tradeType = TradeType.EXACT_OUTPUT
      token = token0
    }
    const subGraphPoolProvider = mixProxy(SubGraphPoolProvider);
    const quoteProviderFactory = mixProxy(V3QuoteProvider);
    const routerTrade = await getBestTrade(
      baseAmount,
      token,
      tradeType,
      {
        gasPriceWei: swapConfig.gasPriceWei,
        maxSplits: swapConfig.allowSplitRouting ? undefined : 0,
        maxHops: swapConfig.allowMultiHops ? undefined : 1,
        allowedPoolTypes: swapConfig.allowedPoolTypes,
        poolProvider: subGraphPoolProvider,
        quoteProvider: quoteProviderFactory,
      },
    )

    if (routerTrade === null)
      throw new Error('Cannot find a valid swap route')

    return routerTrade
  }
}
