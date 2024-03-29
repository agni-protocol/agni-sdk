
import invariant from 'tiny-invariant'
import warning from 'tiny-warning'
import {getAddress} from "ethers";

// warns if addresses are not checksummed
// eslint-disable-next-line consistent-return
export function validateAndParseAddress(address: string): string {
  try {
    const checksummedAddress = getAddress(address)
    warning(address === checksummedAddress, `${address} is not checksummed.`)
    return checksummedAddress
  } catch (error) {
    invariant(false, `${address} is not a valid address.`)
  }
}
