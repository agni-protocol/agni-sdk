import { RouteWithoutQuote, RouteWithQuote } from './route'
import { GasModel } from './gasModel'
import { Currency} from "../../sdk";
import {Pool, PoolType} from "../../../vo";

export interface GetPoolParams {
  currencyA: Currency
  currencyB: Currency
  protocols: PoolType[]
  // Only use this param if we want to specify pairs we want to get
  // pairs?: [Currency, Currency][]
}

export interface PoolProvider {
  getCandidatePools: (params: GetPoolParams) => Promise<Pool[]>
}

export interface QuoterOptions {
  gasModel: GasModel
}

export interface QuoteProvider {
  getRouteWithQuotesExactIn: (routes: RouteWithoutQuote[], options: QuoterOptions) => Promise<RouteWithQuote[]>
  getRouteWithQuotesExactOut: (routes: RouteWithoutQuote[], options: QuoterOptions) => Promise<RouteWithQuote[]>
}
