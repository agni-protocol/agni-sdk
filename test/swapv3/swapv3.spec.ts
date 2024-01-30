import BigNumber from 'bignumber.js'
import {describe, it} from 'vitest'
import {
  ConnectInfo,
  CurrencyAmount,
  getCurrentAddressInfo,
  initAddress,
  PoolType,
  Price,
  SwapConfig,
  Trace, TransactionEvent
} from '../../src'
import {connect, handTx} from '../WalletManager'
import {JsonRpcProvider, Network} from "ethers";
import {ExtTransactionEvent} from "../../src/service/vo/ExtTransactionEvent";

describe('swap v3 test', () => {
  initAddress('dev')

  describe('test', async () => {
    const swapV3Api = getCurrentAddressInfo().getApi().swapV3Api()
    const tokenMangerApi = getCurrentAddressInfo().getApi().tokenMangerApi()

    const swapConfig = {
      gasPriceWei: '100000000000',
      allowedSlippage: '0.0001',
      allowMultiHops: true,
      allowSplitRouting: true,
      allowedPoolTypes: [PoolType.V3],
    } as SwapConfig

    it('wrap', async () => {
      const connectInfo = await connect()
      const mntToken = tokenMangerApi.systemTokens().find(it => it.symbol === 'MNT')
      const wmntToken = tokenMangerApi.systemTokens().find(it => it.symbol === 'WMNT')
      const swapInfo = await swapV3Api.swapInfo(
        wmntToken,
        mntToken,
        connectInfo.account,
      )

      await swapInfo.updateInput(
        wmntToken,
        '1',
        swapConfig,
      )

      const transactionEvent = await swapInfo.wrap(connectInfo)
      Trace.log(transactionEvent.scan())
      Trace.log(await transactionEvent.confirm())

      console.log(swapInfo)
    })

    it('swap', async () => {
      initAddress('dev')
      const connectInfo = await connect()
      const mntToken = tokenMangerApi.systemTokens().find(it => it.symbol === 'MNT')
      const usdtToken = tokenMangerApi.systemTokens().find(it => it.symbol === 'USDT')
      const swapInfo = await swapV3Api.swapInfo(
        mntToken,
        usdtToken,
        connectInfo.account,
      )

      await swapInfo.getTokenPrice('day')
      Trace.log(swapInfo)

      const inputAmount = '1'

      await swapInfo.updateInput(
        usdtToken,
        inputAmount,
        swapConfig,
      )

      Trace.log(swapInfo)

      if (swapInfo.updateInputResult.canSwap) {
        if (swapInfo.token0Balance.showApprove(inputAmount)) {
          const tx = await swapInfo.token0Balance.approve(connectInfo)
          Trace.log(tx.scan())
          Trace.log(await tx.confirm())
        }

        const transactionEvent = await swapInfo.swap(
          connectInfo,
          connectInfo.account,
          60 * 60 * 5,
        )
        Trace.log(transactionEvent.scan())
        Trace.log(await transactionEvent.confirm())
      }
    })
  })
})
describe('swap test price', () => {
  it('price', async () => {
    initAddress('dev')

    const currentAddressInfo = getCurrentAddressInfo()
    const nativeWrappedToken = currentAddressInfo.getApi().tokenMangerApi().WNATIVE()
    const USDTToken = currentAddressInfo.getApi().tokenMangerApi().USDT()
    const DOGEToken = currentAddressInfo.getApi().tokenMangerApi().systemTokens().find(it => it.symbol === 'DOGE')
    const tokenPrice = await currentAddressInfo.api.tokenMangerApi().tokenPrice(DOGEToken, nativeWrappedToken)

    const quoteCurrencyPrice = tokenPrice[0]
    const nativeWrappedTokenPrice = tokenPrice[1]

    {
      const price = new Price(
        nativeWrappedToken,
        DOGEToken,
        new BigNumber(1).multipliedBy(10 ** nativeWrappedToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
        new BigNumber(quoteCurrencyPrice.priceMNT).multipliedBy(10 ** DOGEToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
      )
      Trace.log(price.quote(CurrencyAmount.fromRawAmount(nativeWrappedToken, 1e18)).toFixed())
    }

    {
      const nativeTokenUsdPrice = new Price(
        nativeWrappedToken,
        USDTToken,
        new BigNumber(1).multipliedBy(10 ** nativeWrappedToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
        new BigNumber(nativeWrappedTokenPrice.priceUSD).multipliedBy(10 ** USDTToken.decimals).toFixed(0, BigNumber.ROUND_DOWN),
      )
      Trace.log(nativeTokenUsdPrice.quote(CurrencyAmount.fromRawAmount(nativeWrappedToken, 1e18)).toFixed())
    }
  })
})


describe('swap demo', () => {


  it('Swap', async () => {


    initAddress('dev')

    const currentAddressInfo = getCurrentAddressInfo()
    const swapApi = currentAddressInfo.getApi().swapV3Api();


    // User Address
    const userAddress: string = "0x7D515d229FF5b4b8f3Bc24391B5E1c897363d8D9"


    const connectInfo = await connect()


    // Pair
    const token0Address: string = "MNT" // Token0 Address
    const token1Address: string = "0xd0c049ee0b0832e5678d837c1519e1b2380e32e4"

    // Config
    const swapConfig = {
      gasPriceWei: '100000000000',
      allowedSlippage: '0.0001', // Slippage
      allowMultiHops: true,
      allowSplitRouting: true,
      allowedPoolTypes: [PoolType.V3],
    } as SwapConfig

    const deadline = 60 * 60 * 5;

    const recipientAddr = userAddress


    const tokens = await currentAddressInfo.getApi().tokenMangerApi().batchGetTokens([
      token0Address,
      token1Address
    ]);

    const token0 = tokens[token0Address]
    const token1 = tokens[token1Address]


    // Get trading pair information
    const swapInfo = await swapApi.swapInfo(
      token0,
      token1,
      userAddress,
    )



    // input amount
    const inputAmount = '1'
    // input token
    const inputToken = token0


    const updateInputResult = await swapInfo.updateInput(
      inputToken, inputAmount, swapConfig
    );

    Trace.log("Price Token1 / Token0 ", updateInputResult.token0SwapPrice)
    Trace.log("Price Token0 / Token1", updateInputResult.token1SwapPrice)


    // Is it possible to swap?
    if (updateInputResult.canSwap) {

      // Whether you need to Approve
      if (swapInfo.token0Balance.showApprove(inputAmount)) {

        const tx = await swapInfo.token0Balance.approve(connectInfo)
        await handTx(tx)
      }

      // Swap transactions are on-chain
      const transactionEvent = await swapInfo.swap(
        connectInfo,
        recipientAddr,
        deadline,
      )
      Trace.log(transactionEvent.scan())
      Trace.log(await transactionEvent.confirm())
    }

  })
})
