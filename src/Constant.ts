import {AddressInfo, clearCache} from './service'
import { BasicException } from './BasicException'

let currentAddressInfo: AddressInfo | undefined

export function updateCurrentAddressInfo(addressInfo: AddressInfo): void {
  currentAddressInfo = addressInfo
  clearCache()
}

export function getCurrentAddressInfo(): AddressInfo {
  if (currentAddressInfo === undefined)
    throw new BasicException('not initialized')

  return currentAddressInfo
}
