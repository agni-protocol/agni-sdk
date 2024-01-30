/* eslint-disable no-console */

import {Currency} from "../../sdk";
import {Pool} from "../../../vo";
import {BaseRoute} from "../types";
import {Trace} from "../../Tool";
import {getOutputCurrency, involvesCurrency} from "../utils/pool";
import {buildBaseRoute} from "../utils/route";
import {metric} from "../types/metric";

export function computeAllRoutes(input: Currency, output: Currency, candidatePools: Pool[], maxHops = 3): BaseRoute[] {
  metric('Computing routes from', candidatePools.length, 'pools')
  const poolsUsed = Array<boolean>(candidatePools.length).fill(false)
  const routes: BaseRoute[] = []

  const computeRoutes = (
    currencyIn: Currency,
    currencyOut: Currency,
    currentRoute: Pool[],
    _previousCurrencyOut?: Currency,
  ) => {
    if (currentRoute.length > maxHops) {
      return
    }

    if (currentRoute.length > 0 && involvesCurrency(currentRoute[currentRoute.length - 1], currencyOut)) {
      routes.push(buildBaseRoute([...currentRoute], currencyIn, currencyOut))
      return
    }

    for (let i = 0; i < candidatePools.length; i++) {
      if (poolsUsed[i]) {
        // eslint-disable-next-line
        continue
      }

      const curPool = candidatePools[i]
      const previousCurrencyOut = _previousCurrencyOut || currencyIn

      if (!involvesCurrency(curPool, previousCurrencyOut)) {
        // eslint-disable-next-line
        continue
      }

      const currentTokenOut = getOutputCurrency(curPool, previousCurrencyOut)
      if (currencyIn.wrapped.equals(currentTokenOut.wrapped)) {
        // eslint-disable-next-line
        continue
      }

      currentRoute.push(curPool)
      poolsUsed[i] = true
      computeRoutes(currencyIn, currencyOut, currentRoute, currentTokenOut)
      poolsUsed[i] = false
      currentRoute.pop()
    }
  }

  computeRoutes(input, output, [])

  Trace.debug('Computed routes from', candidatePools.length, 'pools', routes.length, 'routes')
  return routes
}
