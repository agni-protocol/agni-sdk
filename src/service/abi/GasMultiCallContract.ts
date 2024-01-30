import { CacheKey, Trace } from '../tool'
import type { ConnectInfo } from '../../ConnectInfo'

import { MAX_GAS_LIMIT } from '../../mulcall'
import { GasLimitMulticall } from '../../abi'
import { BaseAbi } from './BaseAbi'

export interface GasCallRequest {
  target: string
  callData: string
  gasLimit: number
}

export interface GasCallResponse {
  success: boolean
  returnData: string
  gasUsed: bigint
}

@CacheKey('GasMultiCallContract')
export class GasMultiCallContract extends BaseAbi {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo, connectInfo.addressInfo.gasMulticall as string, GasLimitMulticall)
  }

  async multicall(callRequests: GasCallRequest[]): Promise<GasCallResponse[]> {
    const splitCallsIntoChunks = (calls: GasCallRequest[]) => {
      const chunks: GasCallRequest[][] = [[]]
      const gasLimit = Number.parseInt(Number(MAX_GAS_LIMIT * 0.9).toString())
      let gasLeft = gasLimit
      for (const callRequest of calls) {
        const { target, callData, gasLimit: gasCostLimit } = callRequest
        const singleGasLimit = gasCostLimit
        const currentChunk = chunks[chunks.length - 1]
        if (singleGasLimit > gasLeft) {
          chunks.push([callRequest])
          gasLeft = gasLimit - singleGasLimit
          // Single call exceeds the gas limit
          if (gasLeft < 0) {
            throw new Error(
              `Multicall request may fail as the gas cost of a single call exceeds the gas limit ${gasLimit}. Gas cost: ${singleGasLimit}. To: ${target}. Data: ${callData}`,
            )
          }
          continue
        }
        currentChunk.push(callRequest)
        gasLeft -= singleGasLimit
      }
      return chunks
    }
    const callRequestsChuck = splitCallsIntoChunks(callRequests)
    try {
      const response = []
      for (const callChuck of callRequestsChuck) {
        const {
          returnData,
        } = await this.contract.multicall.staticCall(callChuck, { gasLimit: MAX_GAS_LIMIT })
        response.push(...returnData)
      }
      return response
    }
    catch (e) {
      Trace.error('multicall call error', e)
      throw e
    }
  }
}
