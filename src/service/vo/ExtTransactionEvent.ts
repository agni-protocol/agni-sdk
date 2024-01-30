import type {TransactionReceipt} from 'ethers'
import {ConnectInfo} from '../../ConnectInfo'
import {TransactionEvent} from "./TransactionEvent";

export interface Config{
  gasPrice?: string
  gasLimit?: number
  from?: string
  value?: number | string
  to?:string
}

export class ExtTransactionEvent extends TransactionEvent {

  private _data: string
  private _config: Config

  constructor(connectInfo: ConnectInfo, data: string,config:Config) {
    super(connectInfo, '')
    this._data = data
    this._config = config
  }


  get data(): string {
    return this._data;
  }


  get config(): Config {
    return this._config;
  }

  async confirm(): Promise<TransactionReceipt> {
    throw new Error('ExtTransactionEvent.confirm() not implemented')
  }
}
