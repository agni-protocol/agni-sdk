import {BASE_API, BaseApi} from "../BaseApi";
import {type GasModel, QuoteProvider, QuoterOptions, RouteWithoutQuote, RouteWithQuote} from "../../tool/v3route/types";
import {type GasCallRequest, GasMultiCallContract} from "../../abi";
import {encodeMixedRouteToPath} from "../../tool/math/SwapV3Math";
import {Abi, QUOTER_TRADE_GAS} from "../../../mulcall";
import {getQuoteCurrency} from "../../tool/v3route/utils/route";
import {CacheKey, Currency, CurrencyAmount} from "../../tool";
import {isV2Pool, isV3Pool} from "../../tool/v3route/utils/pool";
import {MixedRouteQuoterV1Contract} from "../../abi/MixedRouteQuoterV1Contract";

@CacheKey('MixedQuoteProvider')
export class MixedQuoteProvider implements QuoteProvider {
  public baseApi: BaseApi = BASE_API

  getRouteWithQuotesExactIn(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    return this.getRouteWithQuotes(routes, options.gasModel, true)
  }

  getRouteWithQuotesExactOut(routes: RouteWithoutQuote[], options: QuoterOptions): Promise<RouteWithQuote[]> {
    return this.getRouteWithQuotes(routes, options.gasModel, false)
  }

  async getRouteWithQuotes(routes: RouteWithoutQuote[], gasModel: GasModel, isExactIn: boolean): Promise<RouteWithQuote[]> {
    const gasMultiCallContract = this.baseApi.connectInfo().create(GasMultiCallContract)
    const mixedRouteQuoterV1 = this.baseApi.connectInfo().create(MixedRouteQuoterV1Contract)
    const funcName = 'quoteExactInput'
    const callInputs = routes.map((route) => {
      const path = encodeMixedRouteToPath(route, !isExactIn)
      const types = route.pools
        .map((pool) => {
          if (isV3Pool(pool)) {
            return 0
          }
          if (isV2Pool(pool)) {
            return 1
          }
          return -1
        })
        .filter((index) => index >= 0);

      return {
        target: this.baseApi.address().quoterV2,
        callData: mixedRouteQuoterV1.contract.interface.encodeFunctionData(funcName, [path, types, route.amount.quotient.toString()]),
        gasLimit: QUOTER_TRADE_GAS,
      } as GasCallRequest
    })

    const gasCallResponses = await gasMultiCallContract.multicall(callInputs)
    const routesWithQuote: RouteWithQuote[] = []

    for (let i = 0; i < gasCallResponses.length; i++) {
      const gasCallResponse = gasCallResponses[i]
      const route = routes[i]
      if (!gasCallResponse.success) {
        // const amountStr = amount.toFixed(Math.min(amount.currency.decimals, 2))
        // const routeStr = routeToString(route)
        // debugFailedQuotes.push({
        //   route: routeStr,
        //   percent,
        //   amount: amountStr,
        // })
        continue
      }
      const quoteResult = Abi.decode(['uint256', 'uint160[]', 'uint32[]', 'uint256'], gasCallResponse.returnData)
      const quoteCurrency = getQuoteCurrency(route, route.amount.currency)
      const quote = CurrencyAmount.fromRawAmount(quoteCurrency.wrapped, quoteResult[0].toString())

      const {gasEstimate, gasCostInToken, gasCostInUSD} = gasModel.estimateGasCost(
        route.pools,
        quoteResult[2],
      )
      const adjustQuoteForGas = (quote: CurrencyAmount<Currency>, gasCostInToken: CurrencyAmount<Currency>) => isExactIn ? quote.subtract(gasCostInToken) : quote.add(gasCostInToken)
      routesWithQuote.push({
        ...route,
        quote,
        quoteAdjustedForGas: adjustQuoteForGas(quote, gasCostInToken),
        // sqrtPriceX96AfterList: quoteResult.result[1],
        gasEstimate,
        gasCostInToken,
        gasCostInUSD,
      })
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
    return routesWithQuote
  }
}
