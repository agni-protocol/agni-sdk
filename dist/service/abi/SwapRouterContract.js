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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwapRouterContract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const Common_1 = require("../tool/math/Common");
const types_1 = require("../tool/v3route/types");
const maximumAmount_1 = require("../tool/v3route/utils/maximumAmount");
const Constant_1 = require("../../Constant");
const SwapV3Math_1 = require("../tool/math/SwapV3Math");
const BaseAbi_1 = require("./BaseAbi");
const pool_1 = require("../tool/v3route/utils/pool");
const route_1 = require("../tool/v3route/utils/route");
const partitionMixedRouteByProtocol = (route) => {
    const acc = [];
    let left = 0;
    let right = 0;
    while (right < route.pools.length) {
        if (route.pools[left].type !== route.pools[right].type) {
            acc.push(route.pools.slice(left, right));
            left = right;
        }
        // seek forward with right pointer
        right++;
        if (right === route.pools.length) {
            /// we reached the end, take the rest
            acc.push(route.pools.slice(left, right));
        }
    }
    return acc;
};
/**
 * Simple utility function to get the output of an array of Pools or Pairs
 * @param pools
 * @param firstInputToken
 * @returns the output token of the last pool in the array
 */
const getOutputOfPools = (pools, firstInputToken) => {
    const { inputToken: outputToken } = pools.reduce(({ inputToken }, pool) => {
        if (!(0, pool_1.involvesCurrency)(pool, inputToken))
            throw new Error('PATH');
        const output = (0, pool_1.getOutputCurrency)(pool, inputToken);
        return {
            inputToken: output,
        };
    }, { inputToken: firstInputToken });
    return outputToken;
};
let SwapRouterContract = class SwapRouterContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.swapRouter, abi_1.SwapRouter);
    }
    encodeV2Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck) {
        const amountIn = (0, maximumAmount_1.maximumAmountIn)(trade, slippageTolerance).quotient;
        const amountOut = (0, maximumAmount_1.minimumAmountOut)(trade, slippageTolerance).quotient;
        // V2 trade should have only one route
        const route = trade.routes[0];
        const path = route.path.map((token) => token.wrapped.address);
        const recipient = routerMustCustody
            ? tool_1.ADDRESS_THIS
            : recipientAddr;
        if (trade.tradeType === tool_1.TradeType.EXACT_INPUT) {
            const exactInputParams = [amountIn, performAggregatedSlippageCheck ? 0n : amountOut, path, recipient];
            return this.contract.interface.encodeFunctionData('swapExactTokensForTokens', exactInputParams);
        }
        const exactOutputParams = [amountOut, amountIn, path, recipient];
        return this.contract.interface.encodeFunctionData('swapTokensForExactTokens', exactOutputParams);
    }
    encodeV3Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline) {
        const calldatas = [];
        for (const route of trade.routes) {
            const { inputAmount, outputAmount, pools, path } = route;
            const amountIn = (0, maximumAmount_1.maximumAmountIn)(trade, slippageTolerance, inputAmount).quotient;
            const amountOut = (0, maximumAmount_1.minimumAmountOut)(trade, slippageTolerance, outputAmount).quotient;
            // flag for whether the trade is single hop or not
            const singleHop = pools.length === 1;
            const recipient = routerMustCustody
                ? (0, Constant_1.getCurrentAddressInfo)().swapRouter
                : recipientAddr;
            if (singleHop) {
                if (trade.tradeType === tool_1.TradeType.EXACT_INPUT) {
                    const exactInputSingleParams = {
                        tokenIn: path[0].wrapped.address,
                        tokenOut: path[1].wrapped.address,
                        fee: pools[0].fee,
                        recipient,
                        deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
                        amountIn,
                        amountOutMinimum: performAggregatedSlippageCheck ? 0n : amountOut,
                        sqrtPriceLimitX96: 0n,
                    };
                    calldatas.push(this.contract.interface.encodeFunctionData('exactInputSingle', [exactInputSingleParams]));
                }
                else {
                    const exactOutputSingleParams = {
                        tokenIn: path[0].wrapped.address,
                        tokenOut: path[1].wrapped.address,
                        fee: pools[0].fee,
                        recipient,
                        deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
                        amountOut,
                        amountInMaximum: amountIn,
                        sqrtPriceLimitX96: 0n,
                    };
                    calldatas.push(this.contract.interface.encodeFunctionData('exactOutputSingle', [exactOutputSingleParams]));
                }
            }
            else {
                const pathStr = (0, SwapV3Math_1.encodeMixedRouteToPath)({ ...route, input: inputAmount.currency, output: outputAmount.currency }, trade.tradeType === tool_1.TradeType.EXACT_OUTPUT);
                if (trade.tradeType === tool_1.TradeType.EXACT_INPUT) {
                    const exactInputParams = {
                        path: pathStr,
                        recipient,
                        deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
                        amountIn,
                        amountOutMinimum: performAggregatedSlippageCheck ? 0n : amountOut,
                    };
                    calldatas.push(this.contract.interface.encodeFunctionData('exactInput', [exactInputParams]));
                }
                else {
                    const exactOutputParams = {
                        path: pathStr,
                        recipient,
                        deadline: (Math.floor(+new Date() / 1000) + (+deadline)).toString(),
                        amountOut,
                        amountInMaximum: amountIn,
                    };
                    calldatas.push(this.contract.interface.encodeFunctionData('exactOutput', [exactOutputParams]));
                }
            }
        }
        return calldatas;
    }
    encodeMixedRouteSwap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline) {
        let calldatas = [];
        const isExactIn = trade.tradeType === tool_1.TradeType.EXACT_INPUT;
        for (const route of trade.routes) {
            const { inputAmount, outputAmount, pools } = route;
            const amountIn = (0, maximumAmount_1.maximumAmountIn)(trade, slippageTolerance, inputAmount).quotient;
            const amountOut = (0, maximumAmount_1.minimumAmountOut)(trade, slippageTolerance, outputAmount).quotient;
            // flag for whether the trade is single hop or not
            const singleHop = pools.length === 1;
            const recipient = routerMustCustody
                ? tool_1.ADDRESS_THIS
                : recipientAddr;
            const mixedRouteIsAllV3 = (r) => {
                return r.pools.every(pool_1.isV3Pool);
            };
            const mixedRouteIsAllV2 = (r) => {
                return r.pools.every(pool_1.isV2Pool);
            };
            if (singleHop) {
                /// For single hop, since it isn't really a mixedRoute, we'll just mimic behavior of V3 or V2
                /// We don't use encodeV3Swap() or encodeV2Swap() because casting the trade to a V3Trade or V2Trade is overcomplex
                if (mixedRouteIsAllV3(route)) {
                    calldatas = [
                        ...calldatas,
                        ...this.encodeV3Swap({
                            ...trade,
                            routes: [route],
                            inputAmount,
                            outputAmount,
                        }, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline),
                    ];
                }
                else if (mixedRouteIsAllV2(route)) {
                    calldatas = [
                        ...calldatas,
                        this.encodeV2Swap({
                            ...trade,
                            routes: [route],
                            inputAmount,
                            outputAmount,
                        }, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck),
                    ];
                }
                else {
                    throw new Error('Unsupported route to encode');
                }
            }
            else {
                const sections = partitionMixedRouteByProtocol(route);
                const isLastSectionInRoute = (i) => {
                    return i === sections.length - 1;
                };
                let outputToken;
                let inputToken = inputAmount.currency.wrapped;
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    /// Now, we get output of this section
                    outputToken = getOutputOfPools(section, inputToken);
                    const newRoute = (0, route_1.buildBaseRoute)([...section], inputToken, outputToken);
                    /// Previous output is now input
                    inputToken = outputToken.wrapped;
                    const lastSectionInRoute = isLastSectionInRoute(i);
                    // By default router holds funds until the last swap, then it is sent to the recipient
                    // special case exists where we are unwrapping WETH output, in which case `routerMustCustody` is set to true
                    // and router still holds the funds. That logic bundled into how the value of `recipient` is calculated
                    const recipientAddress = lastSectionInRoute ? recipient : tool_1.ADDRESS_THIS;
                    const inAmount = i === 0 ? amountIn : 0n;
                    const outAmount = !lastSectionInRoute ? 0n : amountOut;
                    if (mixedRouteIsAllV3(newRoute)) {
                        const pathStr = (0, SwapV3Math_1.encodeMixedRouteToPath)(newRoute, !isExactIn);
                        if (isExactIn) {
                            const exactInputParams = {
                                path: pathStr,
                                recipient: recipientAddress,
                                amountIn: inAmount,
                                amountOutMinimum: outAmount,
                            };
                            calldatas.push(this.contract.interface.encodeFunctionData('exactInput', [exactInputParams]));
                        }
                        else {
                            const exactOutputParams = {
                                path: pathStr,
                                recipient,
                                amountOut: outAmount,
                                amountInMaximum: inAmount,
                            };
                            calldatas.push(this.contract.interface.encodeFunctionData('exactOutput', [exactOutputParams]));
                        }
                    }
                    else if (mixedRouteIsAllV2(newRoute)) {
                        const path = newRoute.path.map((token) => token.wrapped.address);
                        if (isExactIn) {
                            const exactInputParams = [
                                inAmount, // amountIn
                                outAmount, // amountOutMin
                                path, // path
                                recipientAddress, // to
                            ];
                            calldatas.push(this.contract.interface.encodeFunctionData('swapExactTokensForTokens', [exactInputParams]));
                        }
                        else {
                            const exactOutputParams = [outAmount, inAmount, path, recipientAddress];
                            calldatas.push(this.contract.interface.encodeFunctionData('swapTokensForExactTokens', [exactOutputParams]));
                        }
                    }
                    else {
                        throw new Error('Unsupported route');
                    }
                }
            }
        }
        return calldatas;
    }
    async swap(trades, slippageTolerance, recipientAddr, deadline, gasPriceGWei) {
        const numberOfTrades = trades.reduce((numOfTrades, trade) => numOfTrades + trade.routes.length, 0);
        const sampleTrade = trades[0];
        // All trades should have the same starting/ending currency and trade type
        (0, Common_1.invariant)(trades.every(trade => trade.inputAmount.currency.equals(sampleTrade.inputAmount.currency)), 'TOKEN_IN_DIFF');
        (0, Common_1.invariant)(trades.every(trade => trade.outputAmount.currency.equals(sampleTrade.outputAmount.currency)), 'TOKEN_OUT_DIFF');
        (0, Common_1.invariant)(trades.every(trade => trade.tradeType === sampleTrade.tradeType), 'TRADE_TYPE_DIFF');
        const calldatas = [];
        const inputIsNative = sampleTrade.inputAmount.currency.isNative;
        const outputIsNative = sampleTrade.outputAmount.currency.isNative;
        // flag for whether we want to perform an aggregated slippage check
        //   1. when there are >2 exact input trades. this is only a heuristic,
        //      as it's still more gas-expensive even in this case, but has benefits
        //      in that the reversion probability is lower
        const performAggregatedSlippageCheck = sampleTrade.tradeType === tool_1.TradeType.EXACT_INPUT && numberOfTrades > 2;
        // flag for whether funds should be send first to the router
        //   1. when receiving ETH (which much be unwrapped from WETH)
        //   2. when a fee on the output is being taken
        //   3. when performing swap and add
        //   4. when performing an aggregated slippage check
        const routerMustCustody = outputIsNative || performAggregatedSlippageCheck;
        for (const trade of trades) {
            if (trade.routes.every(r => r.type === types_1.RouteType.V2)) {
                calldatas.push(...this.encodeV2Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck));
            }
            else if (trade.routes.every(r => r.type === types_1.RouteType.V3)) {
                calldatas.push(...this.encodeV3Swap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline));
            }
            else {
                calldatas.push(...this.encodeMixedRouteSwap(trade, routerMustCustody, slippageTolerance, recipientAddr, performAggregatedSlippageCheck, deadline));
            }
        }
        const ZERO_IN = tool_1.CurrencyAmount.fromRawAmount(sampleTrade.inputAmount.currency, 0);
        const ZERO_OUT = tool_1.CurrencyAmount.fromRawAmount(sampleTrade.outputAmount.currency, 0);
        const minAmountOut = trades.reduce((sum, trade) => sum.add((0, maximumAmount_1.minimumAmountOut)(trade, slippageTolerance)), ZERO_OUT);
        const totalAmountIn = trades.reduce((sum, trade) => sum.add((0, maximumAmount_1.maximumAmountIn)(trade, slippageTolerance)), ZERO_IN);
        // unwrap or sweep
        if (routerMustCustody) {
            if (outputIsNative) {
                calldatas.push(this.contract.interface.encodeFunctionData('unwrapWMNT', [minAmountOut.quotient, recipientAddr]));
            }
            else {
                calldatas.push(this.contract.interface.encodeFunctionData('sweepToken', [sampleTrade.outputAmount.currency.wrapped.erc20Address(), minAmountOut.quotient, recipientAddr]));
            }
        }
        if (inputIsNative) {
            calldatas.push(this.contract.interface.encodeFunctionData('refundMNT', []));
        }
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'multicall', [calldatas], {
            gasPrice: gasPriceGWei,
            value: inputIsNative ? totalAmountIn.quotient.toString() : '0',
        });
    }
};
exports.SwapRouterContract = SwapRouterContract;
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, tool_1.Percent, String, Object, String]),
    __metadata("design:returntype", Promise)
], SwapRouterContract.prototype, "swap", null);
exports.SwapRouterContract = SwapRouterContract = __decorate([
    (0, tool_1.CacheKey)('SwapRouterContract'),
    __metadata("design:paramtypes", [Function])
], SwapRouterContract);
