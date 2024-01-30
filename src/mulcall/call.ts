import type { Contract } from 'ethers'
import chunk from 'lodash/chunk'
import { Trace } from '../service'
import type { ContractCall } from './types'
import { Abi } from './abi'

export const MAX_GAS_LIMIT = 30000000
export const QUOTER_TRADE_GAS = 3000000
export const CHUNK_SIZE = 200

export async function multicallExecute<T extends any[] = any[]>(
  multicall: Contract,
  calls: ContractCall[],
): Promise<T> {
  const callRequests = calls.map((call) => {
    const callData = Abi.encode(call.name, call.inputs, call.params)
    return {
      target: call.contract.address,
      callData,
    }
  })

  const callRequestsChuck = chunk(callRequests, CHUNK_SIZE)
  try {
    const response = []
    for (const callChuck of callRequestsChuck) {
      const result = await multicall.tryAggregate.staticCall(false, callChuck, { gasLimit: MAX_GAS_LIMIT })
      response.push(...result)
    }
    const callCount = calls.length
    const callResult: T = [] as any
    for (let i = 0; i < callCount; i++) {
      const outputs = calls[i].outputs
      const result = response[i]
      if (result.success) {
        const params = Abi.decode(outputs, result.returnData)
        callResult.push(params)
      }
      else {
        callResult.push(undefined)
      }
    }
    return callResult
  }
  catch (e) {
    Trace.error('multicall call error', e)
    throw e
  }
}
