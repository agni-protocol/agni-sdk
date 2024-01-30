"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapApi = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const vo_1 = require("../vo");
const tool_1 = require("../tool");
const SwapV3Math_1 = require("../tool/math/SwapV3Math");
const getBestTrade_1 = require("../tool/v3route/getBestTrade");
const SwapRouterContract_1 = require("../abi/SwapRouterContract");
const Constant_1 = require("../../Constant");
const abi_1 = require("../abi");
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const get_1 = __importDefault(require("lodash/get"));
const SwapV3Gql_1 = require("./gql/SwapV3Gql");
const BaseApi_1 = require("./BaseApi");
const TransactionHistory_1 = require("./TransactionHistory");
const SubGraphPoolProvider_1 = require("./provider/SubGraphPoolProvider");
const V3QuoteProvider_1 = require("./provider/V3QuoteProvider");
const DashboardGql_1 = require("./gql/DashboardGql");
let SwapApi = class SwapApi {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    async swapInfo(token0, token1, account) {
        const swapInfo = new vo_1.SwapInfo();
        swapInfo.version = 0;
        swapInfo.token0 = token0;
        swapInfo.token1 = token1;
        swapInfo.isWrap = false;
        swapInfo.updateInputResult = {
            canSwap: false,
        };
        if (token0.address === vo_1.ETH_ADDRESS && token1.address === (0, Constant_1.getCurrentAddressInfo)().WMNT) {
            swapInfo.isWrap = true;
            swapInfo.wrapType = 'wrap';
        }
        if (token1.address === vo_1.ETH_ADDRESS && token0.address === (0, Constant_1.getCurrentAddressInfo)().WMNT) {
            swapInfo.isWrap = true;
            swapInfo.wrapType = 'unwrap';
        }
        if (token1.address === (0, Constant_1.getCurrentAddressInfo)().RUSDY && token0.address === (0, Constant_1.getCurrentAddressInfo)().USDY) {
            swapInfo.isWrap = true;
            swapInfo.wrapType = 'wrap';
        }
        if (token0.address === (0, Constant_1.getCurrentAddressInfo)().RUSDY && token1.address === (0, Constant_1.getCurrentAddressInfo)().USDY) {
            swapInfo.isWrap = true;
            swapInfo.wrapType = 'unwrap';
        }
        swapInfo.token0Balance = vo_1.BalanceAndAllowance.unavailable(token0);
        swapInfo.token1Balance = vo_1.BalanceAndAllowance.unavailable(token1);
        const initBalance = async () => {
            if (account) {
                const balanceAndAllowances = await this.baseApi.connectInfo().erc20().batchGetBalanceAndAllowance(account, this.baseApi.address().swapRouter, [token0, token1]);
                swapInfo.token0Balance = balanceAndAllowances[token0.address];
                swapInfo.token1Balance = balanceAndAllowances[token1.address];
            }
        };
        const initTokenUsdPrice = async () => {
            const tokenPrices = await this.baseApi.address().getApi().tokenMangerApi().tokenPrice(token0, token1);
            swapInfo.token0Price = tokenPrices[0];
            swapInfo.token1Price = tokenPrices[1];
        };
        await Promise.all([initBalance(), initTokenUsdPrice()]);
        const swapByRoute = async (inputToken, inputAmount, swapConfig, reload) => {
            const updateResult = {
                ...swapInfo.updateInputResult,
            };
            try {
                if (!reload) {
                    updateResult.trade = undefined;
                    updateResult.canSwap = false;
                    updateResult.swapConfig = swapConfig;
                }
                const routerTrade = await this.getBestTrade(swapInfo.token0, swapInfo.token1, inputAmount, inputToken, swapConfig);
                updateResult.canSwap = true;
                updateResult.trade = routerTrade;
                updateResult.intputToken = inputToken;
                updateResult.inputAmount = inputAmount;
                if (swapInfo.token1.equals(inputToken)) {
                    updateResult.token0Amount = routerTrade.inputAmount.toFixed();
                    updateResult.token1Amount = inputAmount;
                    updateResult.maximumSold = new bignumber_js_1.default(updateResult.token0Amount).multipliedBy(1 + Number.parseFloat(swapConfig.allowedSlippage)).toFixed();
                    updateResult.minimumReceived = undefined;
                }
                else {
                    updateResult.token0Amount = inputAmount;
                    updateResult.token1Amount = routerTrade.outputAmount.toFixed();
                    updateResult.minimumReceived = new bignumber_js_1.default(updateResult.token1Amount).multipliedBy(1 - Number.parseFloat(swapConfig.allowedSlippage)).toFixed();
                    updateResult.maximumSold = undefined;
                }
                updateResult.token0SwapPrice = new bignumber_js_1.default(updateResult.token1Amount).div(updateResult.token0Amount).toFixed();
                updateResult.token1SwapPrice = new bignumber_js_1.default(updateResult.token0Amount).div(updateResult.token1Amount).toFixed();
                const computeTradePrice = (0, SwapV3Math_1.computeTradePriceBreakdown)(routerTrade);
                updateResult.tradingFee = computeTradePrice.lpFeeAmount?.toFixed();
                updateResult.priceImpact = computeTradePrice.priceImpactWithoutFee?.toFixed();
            }
            catch (e) {
                tool_1.Trace.error("ERROR", e);
                updateResult.canSwap = false;
                updateResult.intputToken = undefined;
                updateResult.inputAmount = undefined;
                updateResult.tradingFee = undefined;
                updateResult.minimumReceived = undefined;
                updateResult.maximumSold = undefined;
            }
            swapInfo.updateInputResult = updateResult;
        };
        const swapByWrap = async (inputToken, inputAmount, reload) => {
            const updateResult = {
                ...swapInfo.updateInputResult,
            };
            try {
                if (!reload) {
                    updateResult.canSwap = false;
                }
                updateResult.intputToken = inputToken;
                updateResult.inputAmount = inputAmount;
                updateResult.token0Amount = inputAmount;
                if (swapInfo.wrapType === 'wrap') {
                    if (token0.address === vo_1.ETH_ADDRESS)
                        updateResult.token1Amount = inputAmount;
                    if (token0.address === (0, Constant_1.getCurrentAddressInfo)().USDY)
                        updateResult.token1Amount = await this.baseApi.connectInfo().create(abi_1.RUSDYContract).getRUSDYByShares(inputAmount);
                }
                if (swapInfo.wrapType === 'unwrap') {
                    if (token1.address === vo_1.ETH_ADDRESS)
                        updateResult.token1Amount = inputAmount;
                    if (token1.address === (0, Constant_1.getCurrentAddressInfo)().USDY)
                        updateResult.token1Amount = await this.baseApi.connectInfo().create(abi_1.RUSDYContract).getRUSDYByShares(inputAmount);
                }
                updateResult.canSwap = true;
            }
            catch (e) {
                tool_1.Trace.error(e);
                updateResult.canSwap = false;
                updateResult.intputToken = undefined;
                updateResult.inputAmount = undefined;
            }
            swapInfo.updateInputResult = updateResult;
        };
        const updateInput = async (inputToken, inputAmount, swapConfig, reload) => {
            if (swapInfo.isWrap) {
                if (inputToken.address === token0.address)
                    await swapByWrap(inputToken, inputAmount, reload);
            }
            else {
                await swapByRoute(inputToken, inputAmount, swapConfig, reload);
            }
        };
        swapInfo.updateInput = async (inputToken, inputAmount, swapConfig) => {
            await updateInput(inputToken, inputAmount, swapConfig, false);
            return swapInfo.updateInputResult;
        };
        swapInfo.swap = async (connectInfo, recipientAddr, deadline) => {
            const updateInputResult = swapInfo.updateInputResult;
            if (!updateInputResult.canSwap)
                return;
            if ((0, tool_1.isNullOrUndefined)(recipientAddr))
                recipientAddr = connectInfo.account;
            const slippageTolerance = new tool_1.Percent(BigInt(new bignumber_js_1.default(updateInputResult.swapConfig.allowedSlippage).multipliedBy(10000).toFixed(0, bignumber_js_1.default.ROUND_DOWN)), 10000n);
            const transactionEvent = await connectInfo.create(SwapRouterContract_1.SwapRouterContract).swap([updateInputResult.trade], slippageTolerance, recipientAddr, deadline, updateInputResult.swapConfig.gasPriceWei);
            TransactionHistory_1.transactionHistory.saveHistory(connectInfo, transactionEvent, {
                token0,
                token1,
                token0Amount: updateInputResult.token0Amount,
                token1Amount: updateInputResult.token1Amount,
                type: 'swap',
                to: recipientAddr,
            });
            return transactionEvent;
        };
        swapInfo.wrap = async (connectInfo) => {
            const updateInputResult = swapInfo.updateInputResult;
            let transactionEvent;
            if (swapInfo.wrapType === 'wrap') {
                if (token0.address === vo_1.ETH_ADDRESS)
                    transactionEvent = await connectInfo.create(abi_1.WETHContract).deposit(new bignumber_js_1.default(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN));
                if (token0.address === (0, Constant_1.getCurrentAddressInfo)().USDY)
                    transactionEvent = await connectInfo.create(abi_1.RUSDYContract).wrap(new bignumber_js_1.default(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN));
            }
            if (swapInfo.wrapType === 'unwrap') {
                if (token1.address === vo_1.ETH_ADDRESS)
                    transactionEvent = await connectInfo.create(abi_1.WETHContract).withdraw(new bignumber_js_1.default(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN));
                if (token1.address === (0, Constant_1.getCurrentAddressInfo)().USDY)
                    transactionEvent = await connectInfo.create(abi_1.RUSDYContract).unwrap(new bignumber_js_1.default(updateInputResult.inputAmount).multipliedBy(10 ** token0.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN));
            }
            if (transactionEvent === undefined)
                throw new Error('wrap type error');
            TransactionHistory_1.transactionHistory.saveHistory(connectInfo, transactionEvent, {
                token0,
                token1,
                token0Amount: updateInputResult.token0Amount,
                token1Amount: updateInputResult.token1Amount,
                type: 'swap',
                to: undefined,
            });
            return transactionEvent;
        };
        swapInfo.update = async () => {
            await initBalance();
            await initTokenUsdPrice();
            const updateInputResult = swapInfo.updateInputResult;
            if (updateInputResult.canSwap)
                await updateInput(updateInputResult.intputToken, updateInputResult.inputAmount, updateInputResult.swapConfig, true);
        };
        swapInfo.getTokenPrice = async (type) => {
            return await this.getTokenPrice(type, swapInfo);
        };
        return swapInfo;
    }
    async getTokenPrice(type, swapInfo) {
        swapInfo.tokenPriceType = type;
        swapInfo.tokenPrice = undefined;
        const token0 = swapInfo.token0;
        const token1 = swapInfo.token1;
        if (swapInfo.isWrap)
            return;
        const getTimeConfig = (type) => {
            const endTime = Number.parseInt(String(new Date().getTime() / 1000));
            const dayTimeInterval = 60 * 60 * 24;
            const hourTimeInterval = 60 * 60;
            switch (type) {
                case 'day':
                    return {
                        hour: true,
                        endTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval,
                        interval: hourTimeInterval,
                        startTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval - 24 * hourTimeInterval,
                    };
                case 'week':
                    return {
                        hour: true,
                        endTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval,
                        interval: hourTimeInterval,
                        startTime: parseInt(String(endTime / hourTimeInterval), 10) * hourTimeInterval - 7 * 24 * hourTimeInterval,
                    };
                case 'month':
                    return {
                        hour: false,
                        interval: dayTimeInterval,
                        endTime: parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval,
                        startTime: parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval - 30 * dayTimeInterval,
                    };
                case 'year':
                    return {
                        hour: false,
                        interval: dayTimeInterval,
                        endTime: parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval,
                        startTime: parseInt(String(endTime / dayTimeInterval), 10) * dayTimeInterval - 365 * dayTimeInterval,
                    };
            }
        };
        const timeConfig = getTimeConfig(type);
        const timestamps = [];
        {
            let time = timeConfig.startTime;
            while (time <= timeConfig.endTime) {
                timestamps.push(time);
                time += timeConfig.interval;
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
        if (type === 'month' || type === 'year' || type === 'day' || type === 'week') {
            const deltaTimestamps = tool_1.TimeUtils.getDeltaTimestamps();
            const [block24] = await this.baseApi.address().getApi().dashboard().getBlocksFromTimestamps([deltaTimestamps.t24h], 'exchange-v3');
            const [token0Prices, token1Prices, token0Price24, token1Price24,] = await Promise.all([
                this.baseApi.exchangeV3Graph((0, DashboardGql_1.GetTokenPriceDataGQL)(timeConfig.hour, token0.erc20Address().toLowerCase()), {}),
                this.baseApi.exchangeV3Graph((0, DashboardGql_1.GetTokenPriceDataGQL)(timeConfig.hour, token1.erc20Address().toLowerCase()), {}),
                this.baseApi.exchangeV3Graph((0, SwapV3Gql_1.GetDerivedPricesGQL)(token0.erc20Address().toLowerCase(), [block24]), {}),
                this.baseApi.exchangeV3Graph((0, SwapV3Gql_1.GetDerivedPricesGQL)(token1.erc20Address().toLowerCase(), [block24]), {}),
            ]);
            const price24Token0 = token0Price24[`t${deltaTimestamps.t24h}`]?.derivedUSD;
            const price24Token1 = token1Price24[`t${deltaTimestamps.t24h}`]?.derivedUSD;
            const token1Price24Rate = price24Token0 && price24Token1 ? new bignumber_js_1.default(price24Token0).div(price24Token1).toFixed() : '0';
            const token0Price24Rate = price24Token0 && price24Token1 ? new bignumber_js_1.default(price24Token1).div(price24Token0).toFixed() : '0';
            const token0Kline = (0, tool_1.generatePriceLine)(timeConfig.interval, new Date().getTime() / 1000, 500, true, token0Prices.datas);
            const token1Kline = (0, tool_1.generatePriceLine)(timeConfig.interval, new Date().getTime() / 1000, 500, true, token1Prices.datas);
            const token0PriceData = [];
            const token1PriceData = [];
            const token0Group = (0, groupBy_1.default)(token0Kline, 'time');
            const token1Group = (0, groupBy_1.default)(token1Kline, 'time');
            timestamps.forEach((it) => {
                const price0 = (0, get_1.default)(token0Group, it + '.[0].priceUSD');
                const price1 = (0, get_1.default)(token1Group, it + '.[0].priceUSD');
                if (price0 && price1) {
                    token1PriceData.push({
                        price: price1 === '0' ? '0' : new bignumber_js_1.default(price0).div(price1).toFixed(),
                        time: it,
                    });
                    token0PriceData.push({
                        price: price0 === '0' ? '0' : new bignumber_js_1.default(price1).div(price0).toFixed(),
                        time: it,
                    });
                }
            });
            const token1LastPrice = token1PriceData[token1PriceData.length - 1]?.price || '0';
            const token1Change = new bignumber_js_1.default(token1LastPrice).minus(token1Price24Rate).toFixed();
            const token0LastPrice = token0PriceData[token0PriceData.length - 1]?.price || '0';
            const token0Change = new bignumber_js_1.default(token0LastPrice).minus(token0Price24Rate).toFixed();
            swapInfo.tokenPrice = {
                token0Price: {
                    datas: token1PriceData,
                    lastPrice: token1PriceData[token1PriceData.length - 1]?.price || '0',
                    change24h: parseFloat(token1Price24Rate) <= 0 ? '0' : new bignumber_js_1.default(token1LastPrice).minus(token1Price24Rate).div(token1Price24Rate).multipliedBy(100).toFixed(2),
                    change: token1Change,
                },
                token1Price: {
                    datas: token0PriceData,
                    lastPrice: token0PriceData[token0PriceData.length - 1]?.price || '0',
                    change24h: parseFloat(token0Price24Rate) <= 0 ? '0' : new bignumber_js_1.default(token0LastPrice).minus(token0Price24Rate).div(token0Price24Rate).multipliedBy(100).toFixed(2),
                    change: token0Change,
                }
            };
        }
    }
    async getBestTrade(token0, token1, amount, inputToken, swapConfig) {
        const baseAmount = tool_1.CurrencyAmount.fromRawAmount(inputToken, BigInt(new bignumber_js_1.default(amount).multipliedBy(10 ** inputToken.decimals).toFixed(0, bignumber_js_1.default.ROUND_DOWN)));
        let tradeType = tool_1.TradeType.EXACT_INPUT;
        let token = token1;
        if (token1.equals(inputToken)) {
            tradeType = tool_1.TradeType.EXACT_OUTPUT;
            token = token0;
        }
        const subGraphPoolProvider = (0, tool_1.mixProxy)(SubGraphPoolProvider_1.SubGraphPoolProvider);
        const quoteProviderFactory = (0, tool_1.mixProxy)(V3QuoteProvider_1.V3QuoteProvider);
        const routerTrade = await (0, getBestTrade_1.getBestTrade)(baseAmount, token, tradeType, {
            gasPriceWei: swapConfig.gasPriceWei,
            maxSplits: swapConfig.allowSplitRouting ? undefined : 0,
            maxHops: swapConfig.allowMultiHops ? undefined : 1,
            allowedPoolTypes: swapConfig.allowedPoolTypes,
            poolProvider: subGraphPoolProvider,
            quoteProvider: quoteProviderFactory,
        });
        if (routerTrade === null)
            throw new Error('Cannot find a valid swap route');
        return routerTrade;
    }
};
exports.SwapApi = SwapApi;
exports.SwapApi = SwapApi = __decorate([
    (0, tool_1.CacheKey)('SwapApi'),
    __metadata("design:paramtypes", [])
], SwapApi);
