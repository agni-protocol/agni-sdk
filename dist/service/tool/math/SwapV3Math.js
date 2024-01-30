"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTradePriceBreakdown = exports.encodeMixedRouteToPath = exports.getPairCombinations = exports.INPUT_FRACTION_AFTER_FEE = exports.BASE_FEE = exports.BIPS_BASE = exports.V2_FEE_PATH_PLACEHOLDER = void 0;
const flatMap_1 = __importDefault(require("lodash/flatMap"));
const ethers_1 = require("ethers");
const Constant_1 = require("../../../Constant");
const Tool_1 = require("../Tool");
const sdk_1 = require("../sdk");
const internalConstants_1 = require("../sdk/v3/internalConstants");
const pool_1 = require("../v3route/utils/pool");
const route_1 = require("../v3route/utils/route");
exports.V2_FEE_PATH_PLACEHOLDER = 8388608;
exports.BIPS_BASE = 10000n;
exports.BASE_FEE = new sdk_1.Percent(25n, exports.BIPS_BASE);
exports.INPUT_FRACTION_AFTER_FEE = internalConstants_1.ONE_HUNDRED_PERCENT.subtract(exports.BASE_FEE);
function getPairCombinations(currencyA, currencyB) {
    const currentAddressInfo = (0, Constant_1.getCurrentAddressInfo)();
    const [tokenA, tokenB] = [currencyA, currencyB].sort((a, b) => a.sortsBefore(b) ? -1 : 1);
    const bases = currentAddressInfo.getApi().tokenMangerApi().tradeTokens();
    const basePairs = (0, flatMap_1.default)(bases, (base) => bases.map(otherBase => [base, otherBase]));
    const keySet = new Set();
    const result = [];
    [
        // the direct pair
        [tokenA, tokenB],
        // token A against all bases
        ...bases.map((base) => [tokenA, base]),
        // token B against all bases
        ...bases.map((base) => [tokenB, base]),
        // each base against all bases
        ...basePairs,
    ]
        .filter((tokens) => Boolean(tokens[0] && tokens[1]))
        .filter(([t0, t1]) => !(0, Tool_1.eqAddress)(t0.erc20Address(), t1.erc20Address()))
        .forEach((it) => {
        const [t0, t1] = it.sort((a, b) => a.sortsBefore(b) ? -1 : 1);
        const key = `${t0.erc20Address()}-${t1.erc20Address()}`;
        if (!keySet.has(key)) {
            keySet.add(key);
            result.push(it);
        }
    });
    return result;
}
exports.getPairCombinations = getPairCombinations;
/**
 * Converts a route to a hex encoded path
 * @param route the mixed path to convert to an encoded path
 * @returns the encoded path
 */
function encodeMixedRouteToPath(route, exactOutput) {
    const firstInputToken = route.input.wrapped;
    const { path, types } = route.pools.reduce((
    // eslint-disable-next-line @typescript-eslint/no-shadow
    { inputToken, path, types }, pool, index) => {
        const outputToken = (0, pool_1.getOutputCurrency)(pool, inputToken).wrapped;
        const fee = (0, pool_1.isV3Pool)(pool) ? pool.fee : exports.V2_FEE_PATH_PLACEHOLDER;
        if (index === 0) {
            return {
                inputToken: outputToken,
                types: ['address', 'uint24', 'address'],
                path: [inputToken.address, fee, outputToken.address],
            };
        }
        return {
            inputToken: outputToken,
            types: [...types, 'uint24', 'address'],
            path: [...path, fee, outputToken.address],
        };
    }, { inputToken: firstInputToken, path: [], types: [] });
    return exactOutput ? ethers_1.ethers.solidityPacked(types.reverse(), path.reverse()) : ethers_1.ethers.solidityPacked(types, path);
}
exports.encodeMixedRouteToPath = encodeMixedRouteToPath;
function computeTradePriceBreakdown(trade) {
    if (!trade) {
        return {
            priceImpactWithoutFee: undefined,
            lpFeeAmount: null,
        };
    }
    const { routes, outputAmount, inputAmount } = trade;
    let feePercent = new sdk_1.Percent(0);
    let outputAmountWithoutPriceImpact = sdk_1.CurrencyAmount.fromRawAmount(trade.outputAmount.wrapped.currency, 0);
    for (const route of routes) {
        const { inputAmount: routeInputAmount, pools, percent } = route;
        const routeFeePercent = internalConstants_1.ONE_HUNDRED_PERCENT.subtract(pools.reduce((currentFee, pool) => {
            if ((0, pool_1.isV2Pool)(pool)) {
                return currentFee.multiply(exports.INPUT_FRACTION_AFTER_FEE);
            }
            if ((0, pool_1.isV3Pool)(pool)) {
                return currentFee.multiply(internalConstants_1.ONE_HUNDRED_PERCENT.subtract(v3FeeToPercent(pool.fee)));
            }
            return currentFee;
        }, internalConstants_1.ONE_HUNDRED_PERCENT));
        // Not accurate since for stable swap, the lp fee is deducted on the output side
        feePercent = feePercent.add(routeFeePercent.multiply(new sdk_1.Percent(percent, 100)));
        const midPrice = (0, route_1.getMidPrice)(route);
        outputAmountWithoutPriceImpact = outputAmountWithoutPriceImpact.add(midPrice.quote(routeInputAmount.wrapped));
    }
    if (outputAmountWithoutPriceImpact.quotient === sdk_1.ZERO) {
        return {
            priceImpactWithoutFee: undefined,
            lpFeeAmount: null,
        };
    }
    const priceImpactRaw = outputAmountWithoutPriceImpact
        .subtract(outputAmount.wrapped)
        .divide(outputAmountWithoutPriceImpact);
    const priceImpactPercent = new sdk_1.Percent(priceImpactRaw.numerator, priceImpactRaw.denominator);
    const priceImpactWithoutFee = priceImpactPercent.subtract(feePercent);
    const lpFeeAmount = inputAmount.multiply(feePercent);
    return {
        priceImpactWithoutFee,
        lpFeeAmount,
    };
}
exports.computeTradePriceBreakdown = computeTradePriceBreakdown;
function v3FeeToPercent(fee) {
    return new sdk_1.Percent(fee, 10000n * 100n);
}
