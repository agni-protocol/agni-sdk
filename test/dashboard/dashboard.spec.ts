import { describe, it } from 'vitest'
import { TimeUtils, Trace, getCurrentAddressInfo, initAddress } from '../../src'

describe('dashboard', () => {
  initAddress('dev')

  it('dashboard-block', async () => {
    initAddress('prod')
    const deltaTimestamps = TimeUtils.getDeltaTimestamps()
    const blocks = await getCurrentAddressInfo().getApi().dashboard().getBlocksFromTimestamps(
      [deltaTimestamps.t7d, deltaTimestamps.t14d, deltaTimestamps.t24h, deltaTimestamps.t48h],
    )
    Trace.debug(blocks)
  })
  it('t-block', async () => {
    initAddress('prod')
    const currentTime = new Date().getTime()
    const number = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 15) / 1000).toString())
    const blocks = await getCurrentAddressInfo().getApi().dashboard().getBlocksFromTimestamps(
      [number],
    )
    Trace.debug(blocks)
  })

  it('dashboard-topPool', async () => {
    const dashboardApi = getCurrentAddressInfo().getApi().dashboard()
    const pools = await dashboardApi.topPool()
    Trace.debug(pools)
  })

  it('dashboard-topToken', async () => {
    initAddress('prod')
    const dashboardApi = getCurrentAddressInfo().getApi().dashboard()
    const tokenData = await dashboardApi.topToken()
    Trace.debug(tokenData)
  })

  it('dashboard-protocolData', async () => {
    initAddress('prod')
    const dashboardApi = getCurrentAddressInfo().getApi().dashboard()
    const protocolData = await dashboardApi.protocolData()
    Trace.debug(protocolData)
  })

  it('dashboard-fetchTopTransactions', async () => {
    initAddress('prod')
    const dashboardApi = getCurrentAddressInfo().getApi().dashboard()
    const protocolData = await dashboardApi.topTransactions()
    Trace.debug(protocolData)
  })

  it('dashboard-fetchChartData', async () => {
    initAddress('prod')
    const dashboardApi = getCurrentAddressInfo().getApi().dashboard()
    const protocolData = await dashboardApi.chartData()
    Trace.debug(protocolData)
  })



  it('dashboard-fetchChartData', async () => {
    initAddress('prod')
    const sApiProvider = getCurrentAddressInfo().getApi().SApiProvider()
    const protocolData = await sApiProvider.protocolData()
    Trace.debug(protocolData)
  })
})
