// Cost for crossing an uninitialized tick.
import {ChainId} from '../../sdk'

export const COST_PER_UNINIT_TICK = 0n

export function BASE_SWAP_COST_V3(id: ChainId): bigint {
  switch (id) {
    case ChainId.MANTLE:
    case ChainId.MANTLE_TESTNET:
      // case ChainId.ETHEREUM:
      // case ChainId.GOERLI:
      return 2000n
    default:
      return 0n
  }
}

export function COST_PER_INIT_TICK(id: ChainId): bigint {
  switch (id) {
    case ChainId.MANTLE:
    case ChainId.MANTLE_TESTNET:
      return 31000n
    default:
      return 0n
  }
}

export function COST_PER_HOP_V3(id: ChainId): bigint {
  switch (id) {
    case ChainId.MANTLE:
    case ChainId.MANTLE_TESTNET:
      return 80000n
    default:
      return 0n
  }
}

// Constant cost for doing any swap regardless of pools.
export const BASE_SWAP_COST_V2 = 135000n // 115000, bumped up by 20_000

// Constant per extra hop in the route.
export const COST_PER_EXTRA_HOP_V2 = 50000n // 20000, bumped up by 30_000


export * from './poolSelector'
export * from './routeConfig'
