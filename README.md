# AGNI-SDK


## Installation
  
  ```
  yarn add agni-sdk
  npm install agni-sdk
  ```


## Environment

  ```
  // Testnet
  initAddress('dev')

  // Mainnet
  initAddress('prod_node')
  ```


## Example

[SwapV3](test/swapv3/swapv3.spec.ts)

[Liquidity](test/pool/poolv3.spec.ts)


## Contract Addresses

### TestNet

```
export const TESTNET_ADDRESSES = {
  AgniPoolDeployer: '0x0B7e80F0e664ae80bbE0c56f7908ef14f5898b1d',
  AgniFactory: '0x503Ca2ad7C9C70F4157d14CF94D3ef5Fa96D7032',
  InitCodeHashAddress: '0xECeFAd547Dd6E5556065dF7797D9fC892B5EA864',
  InitCodeHash: '0xaf9bd540c3449b723624376f906d8d3a0e6441ff18b847f05f4f85789ab64d9a',
  WMNT: '0xEa12Be2389c2254bAaD383c6eD1fa1e15202b52A',
  SwapRouter: '0xe2DB835566F8677d6889ffFC4F3304e8Df5Fc1df',
  QuoterV2: '0x49C8bb51C6bb791e8D6C31310cE0C14f68492991',
  TickLens: '0x0DC832e8cA4a7E1CE073096709474A5422029DB3',
  NFTDescriptor: '0x8002eb63E37728ddf15bd42Bf2607CBbBa714b3f',
  NonfungibleTokenPositionDescriptor: '0xDc7E9B3E927f2880CEa359e659321F9d232aCb2c',
  NonfungiblePositionManager: '0xb04a19EF7853c52EDe6FBb28F8FfBecb73329eD7',
  AgniInterfaceMulticall: '0xF9Ae3Cc6D6483722b94d7075C9B366bcbbbab9d3',
  Multicall3: '0x70f0c400171158c29B61a3E79C92c72e95679541',
  tokens: [
    '0xEa12Be2389c2254bAaD383c6eD1fa1e15202b52A', // WMNT
    '0x3e163F861826C3f7878bD8fa8117A179d80731Ab', // USDT
    '0x82a2eb46a64e4908bbc403854bc8aa699bf058e9' // USDC
  ],
}
```



### MainNet

```
export const MAINNET_ADDRESSES = {
  AgniPoolDeployer: '0xe9827B4EBeB9AE41FC57efDdDd79EDddC2EA4d03',
  AgniFactory: '0x25780dc8Fc3cfBD75F33bFDAB65e969b603b2035',
  InitCodeHashAddress: '0x5cfa0f1c4067C90a50B973e5F98CD265de5Df724',
  InitCodeHash: '0xaf9bd540c3449b723624376f906d8d3a0e6441ff18b847f05f4f85789ab64d9a',
  WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
  SwapRouter: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421',
  Quoter: '0x9488C05a7b75a6FefdcAE4f11a33467bcBA60177',
  QuoterV2: '0xc4aaDc921E1cdb66c5300Bc158a313292923C0cb',
  TickLens: '0xEcDbA665AA209247CD334d0D037B913528a7bf67',
  NFTDescriptor: '0x70153a35c3005385b45c47cDcfc7197c1a22477a',
  NonfungibleTokenPositionDescriptor: '0xcb814b767D41b4BD94dA6Abb860D25b607ad5764',
  NonfungiblePositionManager: '0x218bf598D1453383e2F4AA7b14fFB9BfB102D637',
  AgniInterfaceMulticall: '0xBE592EFcF174b3E0E4208DC8c1658822d017568f',
  Multicall3: '0x05f3105fc9FC531712b2570f1C6E11dD4bCf7B3c',
  tokens: [
    '0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8', // WMNT
    '0x201eba5cc46d216ce6dc03f6a759e8e766e956ae', // USDT
    '0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111', // ETH
    '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9', // USDC
  ],
}
```
