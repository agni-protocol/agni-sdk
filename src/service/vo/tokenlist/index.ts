import type { SerializedToken, Token } from '../../tool'
import AgniTokenListSchema from './AgniTokenListSchema.json'

export {
  AgniTokenListSchema,
}

export class StorageTokenListInfo {
  public url: string
  public enable: boolean
}

export class TokenManagerAddInfo {
  public active: boolean
  public token: Token
  import: () => void = () => {
  }
}

export class TokenManagerInfo {
  public token: Token
  remove: () => void = () => {
  }
}

export class TokenSelectInfo {
  public token: Token
  public balance: string
}

export class TokenPrice {
  public token: Token
  public priceUSD: string
  public priceMNT: string

  constructor(token: Token, priceUSD: string, priceMNT: string) {
    this.token = token
    this.priceUSD = priceUSD
    this.priceMNT = priceMNT
  }
}
export class TokenListInfo {
  public storageTokenListInfo: StorageTokenListInfo
  public tokenList: TokenList
  public showRemove: boolean

  remove: () => void = () => {
  }

  updateEnable: (bool: boolean) => void = () => {
  }

  tokenListUrl: () => string = () => {
    return `https://tokenlists.org/token-list?url=${this.storageTokenListInfo.url}`
  }

  version: () => string = () => {
    return `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`
  }
}

export interface Version {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

export interface Tags {
  readonly [tagId: string]: {
    readonly name: string
    readonly description: string
  }
}

export interface TokenList {
  readonly name: string
  readonly timestamp: string
  readonly version: Version
  readonly tokens: SerializedToken[]
  readonly keywords?: string[]
  readonly tags?: Tags
  readonly logoURI?: string
}
