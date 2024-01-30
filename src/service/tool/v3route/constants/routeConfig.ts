import type { RouteConfig } from '../types'
import type { ChainId } from '../../sdk'

export const ROUTE_CONFIG_BY_CHAIN: { [key in ChainId]?: Partial<RouteConfig> } = {}
