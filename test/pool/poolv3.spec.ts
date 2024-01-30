import BigNumber from 'bignumber.js'
import { describe, it } from 'vitest'
import { CurrencyAmount, FeeAmount, PoolV3Api, TICK_SPACINGS, Trace, getCurrentAddressInfo, initAddress } from '../../src'
import { connect } from '../WalletManager'
import type { Tick } from '../../src/service/tool/sdk/v3'
import { Pool } from '../../src/service/tool/sdk/v3'
import { TickMath } from '../../src/service/tool/sdk/v3/utils'

describe('pool v3 test', () => {


  describe('Liquidity list', async () => {
    initAddress('dev')
    const currentAddressInfo = getCurrentAddressInfo()
    const poolV3Api = currentAddressInfo.getApi().poolV3Api()
    // const tokenMangerApi = getCurrentAddressInfo().getApi().tokenMangerApi()
    it('List', async () => {
      initAddress('prod_node')
      const connectInfo = await connect()
      connectInfo.account = "0x1b1217312A31b367199077000af1e4b0CD9C1ea5"
      const { hideClosePosition, allPosition } = await poolV3Api.myLiquidityList(connectInfo)
      Trace.log('hideClosePosition', hideClosePosition)
      Trace.log('allPosition', allPosition)

      allPosition.forEach((it) => {
        Trace.log('-------------------------')
        Trace.log('ID', it.tokenId)
        Trace.log('icon', it.token0.logoURI, it.token1.logoURI)
        Trace.log('name', `${it.token0.symbol}-${it.token1.symbol}-LP`, `(#${it.tokenId})`, `${it.feeAmount / 10000}%`)
        Trace.log('Price', `Min ${it.minPrice} / Max ${it.maxPrice} ${it.token0.symbol} pre ${it.token1.symbol}`)
        Trace.log('Reversal price', `Min ${it.reverseMinPrice} / Max ${it.reverseMaxPrice} ${it.token1.symbol} pre ${it.token0.symbol}`)
        Trace.log('state active|close|inactive', it.state)
      })
    })

    it('Liquidity details by tokenId', async () => {
      initAddress('dev')
      const tokenId = '15'
      const connectInfo = await connect()
      const liquidityInfo = await poolV3Api.myLiquidityByTokenId(connectInfo, tokenId)

      Trace.log('logo ', liquidityInfo.token0.logoURI, liquidityInfo.token1.logoURI)
      Trace.log('name', `${liquidityInfo.token0.symbol}-${liquidityInfo.token1.symbol}`, liquidityInfo.state)
      Trace.log('Fee tier', `V3 LP #${liquidityInfo.tokenId} / ${liquidityInfo.feeAmount / 10000}% fee tier`)
      Trace.log('Add button available status', liquidityInfo.state !== 'close')
      Trace.log('The Close button is available', liquidityInfo.state !== 'close')

      Trace.log('liquidityUSD', liquidityInfo.liquidityUSD)
      Trace.log('APR', `${liquidityInfo.apr}%`)
      Trace.log('Token0', liquidityInfo.token0.logoURI, liquidityInfo.token0.symbol, liquidityInfo.token0Amount, liquidityInfo.token0USD)
      Trace.log('Token1', liquidityInfo.token1.logoURI, liquidityInfo.token1.symbol, liquidityInfo.token1Amount, liquidityInfo.token1USD)

      Trace.log('FEE USD', liquidityInfo.collectUSD)
      Trace.log('Token0', liquidityInfo.token0.logoURI, liquidityInfo.token0.symbol, liquidityInfo.collectToken0, liquidityInfo.collectToken0USD)
      Trace.log('Token1', liquidityInfo.token1.logoURI, liquidityInfo.token1.symbol, liquidityInfo.collectToken1, liquidityInfo.collectToken1USD)

      if (Number.parseFloat(liquidityInfo.collectToken0) > 0 || Number.parseFloat(liquidityInfo.collectToken0) > 0) {
        try {
          const transactionEvent = await liquidityInfo.collectFee(connectInfo, true)
          Trace.log( transactionEvent.hash(), transactionEvent.scan())
          Trace.log(await transactionEvent.confirm())
        }
        catch (e) {
          Trace.log('The transaction failed',e)
        }
      }

      // price range
      Trace.log('View Price', liquidityInfo.token1.symbol)
      Trace.log('Min Price', `Min ${liquidityInfo.minPrice}  ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Max Price', `Max ${liquidityInfo.maxPrice} ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Current price', `Max ${liquidityInfo.currentPrice} ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Reverse Min price', `Min ${liquidityInfo.reverseMinPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)
      Trace.log('Reversal of the Max price', `Max ${liquidityInfo.reverseMaxPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)
      Trace.log('Reverses the current price', `Min ${liquidityInfo.reverseCurrentPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)

      liquidityInfo.histories.forEach((it) => {
        Trace.log('--------------------')
        Trace.log('Action', it.type)
        Trace.log('Title', `${liquidityInfo.token0.symbol} ${it.token0Amount}`, `${liquidityInfo.token1.symbol} ${it.token1Amount}`)
        Trace.log('Time(毫秒)', it.time)
        Trace.log('Link', it.txUrl)
      })
    })

    it('Additional liquidity', async () => {
      initAddress('dev')
      const tokenId = '15'
      const connectInfo = await connect()
      const liquidityInfo = await poolV3Api.myLiquidityByTokenId(connectInfo, tokenId)

      Trace.log('Token0', liquidityInfo.token0.logoURI, liquidityInfo.token0.symbol, liquidityInfo.token0Amount)
      Trace.log('Token1', liquidityInfo.token1.logoURI, liquidityInfo.token1.symbol, liquidityInfo.token1Amount)
      Trace.log('Fee Tier', `${liquidityInfo.feeAmount / 10000}%`)

      // price range
      Trace.log('View Price', liquidityInfo.token1.symbol)
      Trace.log('Min Price', `Min ${liquidityInfo.minPrice}  ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Max Price', `Max ${liquidityInfo.maxPrice} ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Current price', `Max ${liquidityInfo.currentPrice} ${liquidityInfo.token0.symbol} pre ${liquidityInfo.token1.symbol}`)
      Trace.log('Reverse Min price', `Min ${liquidityInfo.reverseMinPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)
      Trace.log('Reversal of the Max price', `Max ${liquidityInfo.reverseMaxPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)
      Trace.log('Reverses the current price', `Min ${liquidityInfo.reverseCurrentPrice} ${liquidityInfo.token1.symbol} pre ${liquidityInfo.token0.symbol}`)

      Trace.log('Token0', liquidityInfo.token0.logoURI, liquidityInfo.token0.symbol, liquidityInfo.token0Balance.balance)
      Trace.log('Token1', liquidityInfo.token1.logoURI, liquidityInfo.token1.symbol, liquidityInfo.token1Balance.balance)

      const inputToken = liquidityInfo.token1
      const inputAmount = '1'
      const {
        amount0,
        amount1,
      } = liquidityInfo.preAddLiquidity(inputToken, inputAmount)
      Trace.log('Input echo', amount0, amount1)

      Trace.log('Whether the Add Liquidity button is visible', amount0 !== '' && amount1 !== '')

      if (liquidityInfo.token0Balance.showApprove(amount0)) {
        try {
          const transactionEvent = await liquidityInfo.token0Balance.approve(connectInfo)
          Trace.log(transactionEvent.hash(), transactionEvent.scan())
          Trace.log(await transactionEvent.confirm())
        }
        catch (e) {
          Trace.log('The transaction failed',e)
        }
      }

      if (liquidityInfo.token1Balance.showApprove(amount1)) {
        try {
          const transactionEvent = await liquidityInfo.token1Balance.approve(connectInfo)
          Trace.log(transactionEvent.hash(), transactionEvent.scan())
          Trace.log(await transactionEvent.confirm())
        }
        catch (e) {
          Trace.log('The transaction failed',e)
        }
      }

      const allowedSlippage = '0.0001'
      // 秒
      const deadline = 5 * 60
      try {
        const transactionEvent = await liquidityInfo.addLiquidity(connectInfo, amount0, amount1, allowedSlippage, deadline)
        Trace.log(transactionEvent.hash(), transactionEvent.scan())
        Trace.log(await transactionEvent.confirm())
      }
      catch (e) {
        Trace.log('The transaction failed',e)
      }

      Trace.log(liquidityInfo)
    })

    it('Remove liquidity', async () => {
      const tokenId = '15'
      const connectInfo = await connect()
      const liquidityInfo = await poolV3Api.myLiquidityByTokenId(connectInfo, tokenId)

      Trace.log( liquidityInfo.token0.logoURI, liquidityInfo.token1.logoURI, `${liquidityInfo.token0.symbol}/${liquidityInfo.token1.symbol}`, liquidityInfo.state)
      Trace.log('ID', `${liquidityInfo.tokenId}`)

      const inputRate = '0.01'
      const {
        amount0,
        amount1,
      } = liquidityInfo.preRemoveLiquidity(inputRate)
      Trace.log('amount0', amount0, `~$${new BigNumber(liquidityInfo.token0Price.priceUSD).multipliedBy(amount0).toFixed()}`)
      Trace.log('amount1', amount1, `~$${new BigNumber(liquidityInfo.token1Price.priceUSD).multipliedBy(amount1).toFixed()}`)

      Trace.log('Fee amount0', liquidityInfo.collectToken0, liquidityInfo.collectToken0USD)
      Trace.log('Fee amount1', liquidityInfo.collectToken1, liquidityInfo.collectToken1USD)

      Trace.log('Collect as WETH ', liquidityInfo.token0.isNative || liquidityInfo.token1.isNative)
      const involvesMNT = true // Collect as WETH

      Trace.log('Can Remove liquidity?', amount0 !== '' && amount1 !== '')
      const allowedSlippage = '0.0001'
      const deadline = 5 * 60
      try {
        const transactionEvent = await liquidityInfo.removeLiquidity(connectInfo, inputRate, involvesMNT, allowedSlippage, deadline)
        Trace.log(transactionEvent.hash(), transactionEvent.scan())
        Trace.log(await transactionEvent.confirm())
      }
      catch (e) {
        Trace.log('The transaction failed',e)
      }
    })
  })

  describe('Add pool liquidity for the first time', async () => {
    const poolV3Api = getCurrentAddressInfo().getApi().poolV3Api()
    const tokenMangerApi = getCurrentAddressInfo().getApi().tokenMangerApi()
    it('Add liquidity', async () => {
      const tokens = tokenMangerApi.systemTokens()
      const mntToken = tokens.find(it => it.name === 'USDC')
      const usdtToken = tokens.find(it => it.name === 'MNT')

      const connectInfo = await connect()
      const account = connectInfo.account

      const addLiquidityV3Info = await poolV3Api.addLiquidity(mntToken, usdtToken, account)
      Trace.log('addLiquidityV3Info', addLiquidityV3Info)

      const selectPoolState = addLiquidityV3Info.poolState.find(it => it.feeAmount === addLiquidityV3Info.feeAmount)
      Trace.log('The pool is selected by default', selectPoolState, `${selectPoolState.feeAmount / 10000}%`, selectPoolState.pick)

      Trace.log('The pool list displays the data', addLiquidityV3Info.poolState)
      addLiquidityV3Info.poolState.forEach((it) => {
        Trace.log('Pool', it.feeAmount, `${it.feeAmount / 10000}%`)
        Trace.log(it.state === 'create' ? `${it.pick * 100}%` : 'no create')
      })

      {
        addLiquidityV3Info.updateFeeAmount(FeeAmount.MEDIUM)
        await addLiquidityV3Info.updateAllTickInfo()
        const selectPoolState = addLiquidityV3Info.poolState.find(it => it.feeAmount === addLiquidityV3Info.feeAmount)
        Trace.log('Selected pools', selectPoolState, `${selectPoolState.feeAmount / 10000}%`, selectPoolState.pick)
      }

      Trace.log('token0 balance', addLiquidityV3Info.token0Balance.balance)
      Trace.log('token1 balance', addLiquidityV3Info.token1Balance.balance)

      if (addLiquidityV3Info.first) {
        const inputFirstPrice = '30'
        if (addLiquidityV3Info.checkFirstPrice(inputFirstPrice)) {
          addLiquidityV3Info.updateFirstPrice(inputFirstPrice)
        }
        else {
          Trace.log('Price is incorrect')
          return
        }
      }
      else {
        const { ticksProcessed } = await addLiquidityV3Info.updateAllTickInfo()
        Trace.log('ticksProcessed', ticksProcessed)
      }

      const minPrice = '0.215135'
      const maxPrice = '0.215135'
      addLiquidityV3Info.setPriceRange(minPrice, maxPrice)

      addLiquidityV3Info.setRate('full')
      addLiquidityV3Info.setRate('20') //  '10' | '20' | '50' | 'full'

      // Deposit Amount 输入
      if (addLiquidityV3Info.maxPrice !== '∞' && new BigNumber(addLiquidityV3Info.minPrice).comparedTo(addLiquidityV3Info.maxPrice) >= 0) {
        Trace.log('Error reported, the minimum price is greater than the maximum price')
      }
      else {
        if (new BigNumber(addLiquidityV3Info.minPrice).comparedTo(addLiquidityV3Info.firstPrice) > 0) {
          // token1 No input is allowed
        }
        if (addLiquidityV3Info.maxPrice !== '∞' && new BigNumber(addLiquidityV3Info.maxPrice).comparedTo(addLiquidityV3Info.firstPrice) < 0) {
          // token0 No input is allowed
        }
        const token1 = addLiquidityV3Info.updateToken0('0.215135')
        Trace.log('token1 amount ', token1)
        const token0 = addLiquidityV3Info.updateToken1('0.215135')
        Trace.log('token0 amount ', token0)
      }

      //
      const addDisable = (
        !addLiquidityV3Info.pool
        || !addLiquidityV3Info.token0Amount
        || !addLiquidityV3Info.token1Amount
        || typeof addLiquidityV3Info.tickLower !== 'number'
        || typeof addLiquidityV3Info.tickUpper !== 'number'
        || addLiquidityV3Info.tickLower >= addLiquidityV3Info.tickUpper
      )
      Trace.debug('addDisable', addDisable)

      Trace.debug('Inactive', Number.parseFloat(addLiquidityV3Info.token0Amount) === 0 || Number.parseFloat(addLiquidityV3Info.token1Amount) === 0)
      Trace.debug('Active', Number.parseFloat(addLiquidityV3Info.token0Amount) > 0 && Number.parseFloat(addLiquidityV3Info.token1Amount) > 0)

      //  View Price in
      const viewPrice = addLiquidityV3Info.token0
      Trace.debug('MinPrice', viewPrice.equals(addLiquidityV3Info.token0) ? addLiquidityV3Info.minPrice : 1 / Number.parseFloat(addLiquidityV3Info.minPrice))
      Trace.debug('MaxPrice', viewPrice.equals(addLiquidityV3Info.token0) ? addLiquidityV3Info.maxPrice : 1 / Number.parseFloat(addLiquidityV3Info.maxPrice))
      Trace.debug('CURRENT PRICE', viewPrice.equals(addLiquidityV3Info.token0) ? addLiquidityV3Info.firstPrice : 1 / Number.parseFloat(addLiquidityV3Info.firstPrice))


      if (addLiquidityV3Info.token0Balance.showApprove(addLiquidityV3Info.token0Amount)) {
        try {
          const transactionEvent = await addLiquidityV3Info.token0Balance.approve(connectInfo)
          Trace.log(transactionEvent.hash(), transactionEvent.scan())
          Trace.log(await transactionEvent.confirm())
        }
        catch (e) {
          Trace.log('The transaction failed',e)
        }
      }

      if (addLiquidityV3Info.token1Balance.showApprove(addLiquidityV3Info.token1Amount)) {
        try {
          const transactionEvent = await addLiquidityV3Info.token1Balance.approve(connectInfo)
          Trace.log(transactionEvent.hash(), transactionEvent.scan())
          Trace.log(await transactionEvent.confirm())
        }
        catch (e) {
          Trace.log('The transaction failed',e)
        }
      }

      // Slippage
      const allowedSlippage = '0.0001'
      // second
      const deadline = 5 * 60

      try {
        const transactionEvent = await addLiquidityV3Info.addLiquidity(connectInfo, allowedSlippage, deadline)
        Trace.log(transactionEvent.hash(), transactionEvent.scan())
        Trace.log( await transactionEvent.confirm())
      }
      catch (e) {
        Trace.log('The transaction failed',e)
      }
    })
  })

  describe('Calculate the pool address', async () => {
    // const poolV3Api = getCurrentAddressInfo().getApi().poolV3Api()
    const tokenMangerApi = getCurrentAddressInfo().getApi().tokenMangerApi()
    it('Calculate the pool address', async () => {
      const tokens = tokenMangerApi.systemTokens()
      const mntToken = tokens.find(it => it.name === 'MNT')
      const usdtToken = tokens.find(it => it.name === 'USDT')

      const poolAddress = PoolV3Api.computePoolAddress(
        mntToken,
        usdtToken,
        FeeAmount.HIGH,
      )
      Trace.log('poolAddress', poolAddress)
    })
  })
})

describe('tickData', async () => {
  it('Calculate the pool tick', async () => {
    initAddress('prod_node')
    const poolV3Api = getCurrentAddressInfo().getApi().poolV3Api()
    const tokenMangerApi = getCurrentAddressInfo().getApi().tokenMangerApi()
    const USDC = '0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9'
    const USDY = '0x5be26527e817998a7206475496fde1e68957c5a6'
    const tokens = await tokenMangerApi.batchGetTokens([USDC, USDY])
    const tickData = await poolV3Api.allTickInfo(tokens[USDC], tokens[USDY], FeeAmount.LOW)
    const pools = await poolV3Api.getPool([{ token0: tokens[USDC], token1: tokens[USDY], feeAmount: FeeAmount.LOW }])

    for (let i = 0; i < tickData.tickDatas.length; i++) {
      const t = tickData.tickDatas[i]
      const tp = tickData.ticksProcessed[i]
      const pool = pools[0]
      const mockTicks = [
        {
          index: Number.parseInt(String(t.tick)) - TICK_SPACINGS[FeeAmount.LOW],
          liquidityGross: BigInt(t.liquidityGross),
          liquidityNet: BigInt(t.liquidityNet) * BigInt('-1'),
        },
        {
          index: Number.parseInt(String(t.tick)),
          liquidityGross: BigInt(t.liquidityGross),
          liquidityNet: BigInt(t.liquidityNet),
        },
      ] as Tick[]
      let price

      const sqrtRatioAtTick = TickMath.getSqrtRatioAtTick(Number.parseInt(String(t.tick)))
      const newPool = new Pool(pool.token0, pool.token1, pool.fee, sqrtRatioAtTick, BigInt(tp.liquidityActive), Number.parseInt(String(tp.tick)), mockTicks)

      if (i > 0)
        price = TickMath.getSqrtRatioAtTick(tickData.ticksProcessed[i - 1].tick)
      const MAX_UINT128 = 2n ** 128n - 1n
      const inputAmount = CurrencyAmount.fromRawAmount(tokens[USDC], MAX_UINT128)
      const newVar = await newPool.getOutputAmount(inputAmount, price)
      Trace.log(inputAmount.toExact(), newVar[0].toExact(), new BigNumber(newVar[0].toExact()).div(1e18).div(1e6).toFixed())
    }

    // Trace.log(tickData)
  })
})
