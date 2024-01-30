"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V3QuoteProvider = void 0;
const abi_1 = require("../../abi");
const SwapV3Math_1 = require("../../tool/math/SwapV3Math");
const mulcall_1 = require("../../../mulcall");
const route_1 = require("../../tool/v3route/utils/route");
const tool_1 = require("../../tool");
const BaseApi_1 = require("../BaseApi");
let V3QuoteProvider = class V3QuoteProvider {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    getRouteWithQuotesExactIn(routes, options) {
        return this.getRouteWithQuotes(routes, options.gasModel, true);
    }
    getRouteWithQuotesExactOut(routes, options) {
        return this.getRouteWithQuotes(routes, options.gasModel, false);
    }
    async getRouteWithQuotes(routes, gasModel, isExactIn) {
        const gasMultiCallContract = this.baseApi.connectInfo().create(abi_1.GasMultiCallContract);
        const quoterV2 = this.baseApi.connectInfo().create(abi_1.QuoterV2Contract);
        const funcName = isExactIn ? 'quoteExactInput' : 'quoteExactOutput';
        const callInputs = routes.map((route) => {
            const path = (0, SwapV3Math_1.encodeMixedRouteToPath)(route, !isExactIn);
            return {
                target: this.baseApi.address().quoterV2,
                callData: quoterV2.contract.interface.encodeFunctionData(funcName, [path, route.amount.quotient.toString()]),
                gasLimit: mulcall_1.QUOTER_TRADE_GAS,
            };
        });
        const gasCallResponses = await gasMultiCallContract.multicall(callInputs);
        const routesWithQuote = [];
        for (let i = 0; i < gasCallResponses.length; i++) {
            const gasCallResponse = gasCallResponses[i];
            const route = routes[i];
            if (!gasCallResponse.success) {
                // const amountStr = amount.toFixed(Math.min(amount.currency.decimals, 2))
                // const routeStr = routeToString(route)
                // debugFailedQuotes.push({
                //   route: routeStr,
                //   percent,
                //   amount: amountStr,
                // })
                continue;
            }
            const quoteResult = mulcall_1.Abi.decode(['uint256', 'uint160[]', 'uint32[]', 'uint256'], gasCallResponse.returnData);
            const quoteCurrency = (0, route_1.getQuoteCurrency)(route, route.amount.currency);
            const quote = tool_1.CurrencyAmount.fromRawAmount(quoteCurrency.wrapped, quoteResult[0].toString());
            const { gasEstimate, gasCostInToken, gasCostInUSD } = gasModel.estimateGasCost(route.pools, quoteResult[2]);
            const adjustQuoteForGas = (quote, gasCostInToken) => isExactIn ? quote.subtract(gasCostInToken) : quote.add(gasCostInToken);
            routesWithQuote.push({
                ...route,
                quote,
                quoteAdjustedForGas: adjustQuoteForGas(quote, gasCostInToken),
                // sqrtPriceX96AfterList: quoteResult.result[1],
                gasEstimate,
                gasCostInToken,
                gasCostInUSD,
            });
        }
        // gasCallResponses.forEach((it) => {
        //   if (it.success) {
        //     // (
        //     //             uint256 amountOut,
        //     //             uint160[] memory sqrtPriceX96AfterList,
        //     //             uint32[] memory initializedTicksCrossedList,
        //     //             uint256 gasEstimate
        //     //         )
        //
        //     // console.log(result)
        //   }
        // })
        return routesWithQuote;
    }
};
exports.V3QuoteProvider = V3QuoteProvider;
exports.V3QuoteProvider = V3QuoteProvider = __decorate([
    (0, tool_1.CacheKey)('V3QuoteProvider')
], V3QuoteProvider);
