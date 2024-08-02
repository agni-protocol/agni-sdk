import { updateCurrentAddressInfo } from '../Constant'
import { ConnectManager } from '../WalletConnect'
import { AddressInfo, StorageProvider, Trace } from '../service'


export const TESTNET_ADDRESSES = {
  "AgniPoolDeployer": "0x6C53C6cC7c10B389c5680458Fc0C4079f3F012b4",
  "AgniFactory": "0xA9AcD50B042A72c33d05fDcC8ad209d3aD361762",
  "InitCodeHashAddress": "0xa18655b73FDC38665CFB9e09A5a0a10C14e68EC5",
  "InitCodeHash": "0xaf9bd540c3449b723624376f906d8d3a0e6441ff18b847f05f4f85789ab64d9a",
  "WMNT": "0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF",
  "SwapRouter": "0xe38cfa32cCd918d94E2e20230dFaD1A4Fd8aEF16",
  "Quoter": "0xA82F8dC4704d3512b120de70480219761F24B6Eb",
  "QuoterV2": "0x9Da17239a4170f50A5A2c11813BD0C601b5c9693",
  "TickLens": "0xB4EB98c6d7D4807033Ae6195241ef7A839070748",
  "NFTDescriptor": "0x7C20eE7CC3230003401cC19BF076871Aedf39856",
  "NonfungibleTokenPositionDescriptor": "0x497bd1C86a1088e80f58EaA13de8C81aB70a4e79",
  "NonfungiblePositionManager": "0x71959543c31EC4d68D9D6C492Bf69A1C174bb394",
  "AgniInterfaceMulticall": "0x49b05721B9615dC1811E20F47D5700dA2d6Ed429",
  "Multicall3": "0x521751C88EafdCAEd9cAbb4dB35a1400D6933428",
  tokens: [
    '0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF',
    '0xcc4ac915857532ada58d69493554c6d869932fe6',
    '0xacab8129e2ce587fd203fd770ec9ecafa2c88080',
    '0xf6762afb45ac0af7ddc5aa92b885c6ece57874dc',
    '0x3edb12e9cf43a6f645eedee2800e01e142c5758d'
  ],
}


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
    '0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8',
    '0x201eba5cc46d216ce6dc03f6a759e8e766e956ae',
    '0xdeaddeaddeaddeaddeaddeaddeaddeaddead1111',
    '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9',
  ],
}

export function initAddress(ENV: 'dev' | 'test' | 'prod' | 'prod_node'): void {
  if (ENV === 'dev' || ENV === 'test') {
    const addressInfo = new AddressInfo()
    addressInfo.chainId = 5003
    addressInfo.chainName = 'Mantle Testnet'
    addressInfo.scan = 'https://explorer.sepolia.mantle.xyz'
    addressInfo.rpc = 'https://rpc.sepolia.mantle.xyz'
    addressInfo.gasMulticall = '0x7Cba166389556fa21Ab9229330912184BbD8bb96'
    addressInfo.multicall = TESTNET_ADDRESSES.Multicall3
    addressInfo.initCodeHashAddress = TESTNET_ADDRESSES.InitCodeHashAddress
    addressInfo.initCodeHash = TESTNET_ADDRESSES.InitCodeHash
    addressInfo.swapRouter = TESTNET_ADDRESSES.SwapRouter
    addressInfo.quoterV2 = TESTNET_ADDRESSES.QuoterV2
    addressInfo.tickLens = TESTNET_ADDRESSES.TickLens
    addressInfo.nftDescriptor = TESTNET_ADDRESSES.NFTDescriptor
    addressInfo.nonfungibleTokenPositionDescriptor = TESTNET_ADDRESSES.NonfungibleTokenPositionDescriptor
    addressInfo.nonfungiblePositionManager = TESTNET_ADDRESSES.NonfungiblePositionManager
    addressInfo.agniPoolDeployer = TESTNET_ADDRESSES.AgniPoolDeployer
    addressInfo.WMNT = TESTNET_ADDRESSES.WMNT
    addressInfo.USDT = '0xcc4ac915857532ada58d69493554c6d869932fe6'
    addressInfo.exchangeV3GraphApi = 'https://testnet.agni.finance/graph/subgraphs/name/agni/exchange-v3'
    addressInfo.exchangeV2GraphApi = 'https://testnet.agni.finance/graph/subgraphs/name/agni/exchange-v2'
    addressInfo.blockGraphApi = 'https://testnet.agni.finance/graph/subgraphs/name/agni/blocks'
    addressInfo.launchpadGraphApi = 'https://testnet.agni.finance/graph/subgraphs/name/agni/launchpad'
    addressInfo.projectPartyRewardGraphApi = 'https://testnet.agni.finance/graph/subgraphs/name/agni/project-party-reward'

    addressInfo.launchpadStakePool = ''
    addressInfo.launchpadInsurancePool = ''
    addressInfo.launchpadStakeToken =  TESTNET_ADDRESSES.WMNT
    addressInfo.baseApiUrl = 'https://testnet.agni.finance'

    addressInfo.RUSDY = '0xab575258d37eaa5c8956efabe71f4ee8f6397cf4'
    addressInfo.USDY = '0x5bE26527e817998A7206475496fDE1E68957c5A8'


    addressInfo.baseTradeToken = [
      '0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF',
      '0xcc4ac915857532ada58d69493554c6d869932fe6',
      '0xacab8129e2ce587fd203fd770ec9ecafa2c88080',
      '0xf6762afb45ac0af7ddc5aa92b885c6ece57874dc',
      '0x3edb12e9cf43a6f645eedee2800e01e142c5758d'
    ]

    if (ENV === 'dev')
      addressInfo.storage = new StorageProvider('node')

    if (ENV === 'test')
      addressInfo.storage = new StorageProvider('web')

    updateCurrentAddressInfo(addressInfo)
  }
  else if (ENV === 'prod' || ENV === 'prod_node') {
    const addressInfo = new AddressInfo()
    addressInfo.chainId = 5000
    addressInfo.chainName = 'Mantle'
    addressInfo.scan = 'https://explorer.mantle.xyz'
    addressInfo.rpc = 'https://rpc.mantle.xyz'
    addressInfo.gasMulticall = '0x0B0BDCFB1Cc30C80A8fE507516943557766fEC0c'
    addressInfo.multicall = MAINNET_ADDRESSES.Multicall3
    addressInfo.initCodeHashAddress = MAINNET_ADDRESSES.InitCodeHashAddress
    addressInfo.initCodeHash = MAINNET_ADDRESSES.InitCodeHash
    addressInfo.swapRouter = MAINNET_ADDRESSES.SwapRouter
    addressInfo.quoterV2 = MAINNET_ADDRESSES.QuoterV2
    addressInfo.tickLens = MAINNET_ADDRESSES.TickLens
    addressInfo.nftDescriptor = MAINNET_ADDRESSES.NFTDescriptor
    addressInfo.nonfungibleTokenPositionDescriptor = MAINNET_ADDRESSES.NonfungibleTokenPositionDescriptor
    addressInfo.nonfungiblePositionManager = MAINNET_ADDRESSES.NonfungiblePositionManager
    addressInfo.agniPoolDeployer = MAINNET_ADDRESSES.AgniPoolDeployer
    addressInfo.WMNT = MAINNET_ADDRESSES.WMNT
    addressInfo.USDT = '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'
    addressInfo.RUSDY = '0xab575258d37eaa5c8956efabe71f4ee8f6397cf3'
    addressInfo.USDY = '0x5bE26527e817998A7206475496fDE1E68957c5A6'
    addressInfo.baseTradeToken = [
      '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
      '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
      '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
      '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
      '0xcda86a272531e8640cd7f1a92c01839911b90bb0',
    ]
    addressInfo.exchangeV2GraphApi = 'https://agni.finance/graph/subgraphs/name/agni/exchange-v2'
    addressInfo.exchangeV3GraphApi = 'https://agni.finance/graph/subgraphs/name/agni/exchange-v3'
    addressInfo.launchpadGraphApi = 'https://agni.finance/graph/subgraphs/name/agni/launchpad'
    addressInfo.blockGraphApi = 'https://agni.finance/graph/subgraphs/name/agni/blocks'
    addressInfo.projectPartyRewardGraphApi = 'https://agni.finance/graph/subgraphs/name/agni/project-party-reward'

    addressInfo.launchpadStakePool = ''
    addressInfo.launchpadInsurancePool = ''
    addressInfo.launchpadStakeToken =  MAINNET_ADDRESSES.WMNT

    addressInfo.baseApiUrl = 'https://agni.finance'
    if (ENV === 'prod')
      addressInfo.storage = new StorageProvider('web')

    if (ENV === 'prod_node')
      addressInfo.storage = new StorageProvider('node')

    updateCurrentAddressInfo(addressInfo)
  }
  else {
    throw new Error(`${ENV} is not support`)
  }
  Trace.debug('address config init', ENV)
  ConnectManager.chainMap['Mantle Testnet'] = [
    {
      chainId: '0x1389',
      chainName: 'Mantle Testnet',
      nativeCurrency: {
        name: 'MNT',
        symbol: 'MNT',
        decimals: 18,
      },
      rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
      blockExplorerUrls: ['https://explorer.testnet.mantle.xyz/'],
    },
  ]
  ConnectManager.chainMap.Mantle = [
    {
      chainId: '0x1388',
      chainName: 'Mantle',
      nativeCurrency: {
        name: 'MNT',
        symbol: 'MNT',
        decimals: 18,
      },
      rpcUrls: ['https://rpc.mantle.xyz'],
      blockExplorerUrls: ['https://explorer.mantle.xyz/'],
    },
  ]
  ConnectManager.chainMap.Goerli = '0x5'
  ConnectManager.chainMap.sepolia = '0xaa36a7'
}
