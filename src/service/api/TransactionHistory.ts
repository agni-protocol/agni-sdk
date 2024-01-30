import type { ConnectInfo } from '../../ConnectInfo'
import type { RecentTransactions, SaveRecentTransaction, StorageRecentTransaction, TransactionEvent } from '../vo'
import { Trace } from '../tool'
import type { BaseApi } from './BaseApi'
import { BASE_API } from './BaseApi'

export class TransactionHistory {
  static connect: ConnectInfo
  static start: boolean
  static timoutId: any

  private baseApi: BaseApi

  constructor() {
    this.baseApi = BASE_API
  }

  private getKey(connectInfo: ConnectInfo) {
    return `${connectInfo.chainId}-${connectInfo.account}`
  }

  initUpdateTransaction(connectInfo: ConnectInfo, start: boolean) {
    if (start) {
      TransactionHistory.connect = connectInfo
      TransactionHistory.start = start
      this.startUpdateTransaction()
    }
    else {
      TransactionHistory.connect = undefined
      TransactionHistory.start = start
      if ((TransactionHistory.timoutId))
        clearTimeout(TransactionHistory.timoutId)
    }
  }

  private startUpdateTransaction() {
    if ((TransactionHistory.timoutId))
      clearTimeout(TransactionHistory.timoutId)

    if (TransactionHistory.start && TransactionHistory.connect) {
      TransactionHistory.timoutId = setTimeout(async () => {
        try {
          await this.updateTransaction(TransactionHistory.connect as ConnectInfo)
        }
        finally {
          this.startUpdateTransaction()
        }
      }, 5000)
    }
    else {
      TransactionHistory.timoutId = undefined
    }
  }

  private async updateTransaction(connectInfo: ConnectInfo) {
    const transactions = this.storageHistories(connectInfo)
    const storageRecentTransactions = transactions.filter(it => it.status === 'pending')
    for (const storageRecentTransaction of storageRecentTransactions) {
      try {
        await connectInfo.tx().checkTransactionError(storageRecentTransaction.txHash)
        storageRecentTransaction.status = 'success'
      }
      catch (e) {
        storageRecentTransaction.status = 'fail'
      }
    }
    this.update(connectInfo, storageRecentTransactions)
  }

  saveHistory(connectInfo: ConnectInfo, event: TransactionEvent, saveData: SaveRecentTransaction) {
    try {
      if (event.hash() === ''){
        return
      }

      const transactions = this.storageHistories(connectInfo)
      const data: StorageRecentTransaction = {
        index: transactions.length,
        txHash: event.hash(),
        chainId: connectInfo.chainId,
        token0: saveData.token0,
        token1: saveData.token1,
        token0Amount: saveData.token0Amount,
        token1Amount: saveData.token1Amount,
        type: saveData.type,
        time: new Date().getTime(),
        to: saveData.to || connectInfo.account,
        status: 'pending',
      }
      transactions.push(data)
      this.baseApi.address().storage.setJson(this.getKey(connectInfo), transactions)
    }
    catch (e) {
      Trace.error('TransactionHistory:saveHistory error ', e)
    }
  }

  histories(connectInfo: ConnectInfo): RecentTransactions[] {
    const storageRecentTransactions = this.storageHistories(connectInfo)
    return Array.from(storageRecentTransactions).reverse().map((it) => {
      const chainName = connectInfo.addressInfo.chainName as string

      let title = ''
      switch (it.type) {
        case 'remove':
          title = `Remove ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`
          break
        case 'add':
          title = `Add ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`
          break
        case 'collect_fee':
          title = `Collect Fee ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`
          break
        case 'swap':
          title = `Swap ${it.token0Amount} ${it.token0.symbol} for min.${it.token1Amount} ${it.token1.symbol} to ${it.to}`
          break
      }

      return {
        ...it,
        hashUrl: connectInfo.addressInfo.getEtherscanTx(it.txHash),
        title,
        chainName,
      }
    })
  }

  removeByTxHash(connectInfo: ConnectInfo, txHash: string) {
    this.baseApi.address().storage.setJson(this.getKey(connectInfo), this.storageHistories(connectInfo)
      .filter(it => it.txHash === txHash))
  }

  removeByIndex(connectInfo: ConnectInfo, index: number) {
    this.baseApi.address().storage.setJson(this.getKey(connectInfo), this.storageHistories(connectInfo)
      .filter(it => it.index === index))
  }

  private update(connectInfo: ConnectInfo, transactions: StorageRecentTransaction[]) {
    const storageRecentTransactions = this.storageHistories(connectInfo)
    for (const it of transactions) {
      if (storageRecentTransactions[it.index].txHash === it.txHash)
        storageRecentTransactions[it.index] = it
    }
    this.baseApi.address().storage.setJson(this.getKey(connectInfo), storageRecentTransactions)
  }

  removeAll(connectInfo: ConnectInfo) {
    this.baseApi.address().storage.setJson(this.getKey(connectInfo), [])
  }

  private storageHistories(connectInfo: ConnectInfo): StorageRecentTransaction[] {
    return this.baseApi.address().storage.getArray(this.getKey(connectInfo)) || []
  }
}

const transactionHistory = new TransactionHistory()
export {
  transactionHistory,
}
