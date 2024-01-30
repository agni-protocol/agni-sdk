import { invariant } from '../math/Common'
import { getCurrentAddressInfo } from '../../../Constant'
import { DEFAULT_ICON, ETH_ADDRESS } from '../../vo'
import { isNullOrUndefined } from '../Tool'
import type { Currency } from './currency'
import { BaseCurrency } from './baseCurrency'

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol: string
  name?: string
  logoURI?: string
}

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends BaseCurrency {
  public readonly isNative: boolean
  public readonly isToken: boolean

  /**
   * The contract address on the chain on which this token lives
   */
  public readonly address: string

  public readonly logoURI?: string

  static fromSerialized(serializedToken: SerializedToken) {
    return new Token(serializedToken.chainId, serializedToken.address, serializedToken.decimals, serializedToken.symbol, serializedToken.name, serializedToken.logoURI)
  }

  public constructor(
    chainId: number,
    address: string,
    decimals: number,
    symbol: string,
    name?: string,
    logoURI?: string,
  ) {
    super(chainId, decimals, symbol, name)
    this.address = address
    this.logoURI = logoURI
    this.isNative = this.address === ETH_ADDRESS
    this.isToken = !this.isNative
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: Currency): boolean {
    return !isNullOrUndefined(other) && this.chainId === other.chainId && this.address === other.address
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS')

    // console.log('this.address', this.address, other?.address)
    // invariant(this.address !== other?.address, 'ADDRESSES')
    return this.erc20Address().toLowerCase() < other?.erc20Address().toLowerCase()
  }

  public get wrapped(): Token {
    if (this.isNative)
      return getCurrentAddressInfo().getApi().tokenMangerApi().WNATIVE()

    return this
  }

  public get serialize(): SerializedToken {
    return {
      address: this.address,
      chainId: this.chainId,
      decimals: this.decimals,
      symbol: this.symbol,
      name: this.name,
      logoURI: this.logoURI,
    }
  }

  public erc20Address(): string {
    return this.address === ETH_ADDRESS ? getCurrentAddressInfo().WMNT : this.address
  }

  public iconUrl(): string {
    return this.logoURI ? this.logoURI : DEFAULT_ICON
  }

  public scanUrl(): string {
    return this.address === ETH_ADDRESS ? '' : getCurrentAddressInfo().getEtherscanAddress(this.address)
  }
}
