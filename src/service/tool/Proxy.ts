// ERROR 栈

import template from 'lodash/template'
import { Contract } from 'ethers'
import { BasicException } from '../../BasicException'
import { Trace } from './Tool'
import {Cache, getCache} from './Cache'
import {ConnectInfo} from "../../ConnectInfo";

export class ErrorInfo {
  error: Error
  msg: string
  method: string
  args: any
  target: any
}

let availableErrorHandler: (error: ErrorInfo) => void = (error: ErrorInfo) => {
  Trace.error('availableErrorHandler', error)
}

/**
 * 注册 交易异常处理回调
 * @param errorHandler
 */
export function registerTransactionErrorHandler(errorHandler: (error: ErrorInfo) => void) {
  availableErrorHandler = errorHandler
}

/**
 * 异常处理控制器
 * @param e
 * @param method
 * @param args
 * @param target
 */
export function errorHandlerController(e: Error, method: string, args: any, target: any) {
  try {
    const errorInfo = new ErrorInfo()
    errorInfo.error = e
    errorInfo.method = method
    try {
      errorInfo.args = JSON.stringify(args)
    }
    catch (e) {
      errorInfo.args = args
    }
    errorInfo.target = target

    if (e instanceof BasicException)
      errorInfo.msg = e.msg
    else
      errorInfo.msg = e.toString()

    availableErrorHandler(errorInfo)
  }
  catch (e) {
    Trace.error(e)
  }
}


export type Newable<T extends object> = new (...args: any[]) => T


export function mixProxy<T extends object>(clazz: Newable<T>, ...args: any[]): T {
  return mixProxyByConnect(clazz, null, ...args)
}
export function mixProxyByConnect<T extends object>(clazz: Newable<T>,connectInfo:ConnectInfo, ...args: any[]): T {
  const cacheKey = (clazz as any).CACHE_KEY
  if (!cacheKey)
    throw new BasicException('clazz must have CACHE_KEY')

  try {
    const key = `${connectInfo && connectInfo.writeState  ? "CONNECT_INFO":"MIX_PROXY"}_${cacheKey}_${JSON.stringify(args)}`
    const element = getCache().getByCreate(key,()=>{
      const arg = connectInfo ?  [connectInfo,...args] : args
      const instance = createProxy<T>(new clazz(...arg))
      return [instance,Cache.ETERNITY_TTL]
    })
    return element;
  }catch (e) {
    Trace.error("mixProxy",cacheKey,connectInfo,args,e)
    throw e
  }
}

/**
 * 对象代理
 * @param obj
 */
export function createProxy<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target: any, propKey: string) {
      const ins = Reflect.get(target, propKey)
      if (ins instanceof Contract)
        return ins

      if (ins && (ins.proxyEnable || ins.logEnable || ins.methodCache)) {
        return function () {
          // eslint-disable-next-line prefer-rest-params
          const args = arguments

          const showError = (err: any) => {
            if (ins.proxyEnable)
              errorHandlerController(err, propKey, args, target)

            if (ins.logEnable) {
              errorHandlerController(err, propKey, args, target)
              Trace.debug(`${(target.constructor as any).CACHE_KEY}.${propKey}`, 'args=', args, 'error', err)
            }
          }

          const showLog = (data: any) => {
            if (ins.logEnable) {
              Trace.debug(
                `${(target.constructor as any).CACHE_KEY}.${propKey} `,
                'args=',
                args,
                'result',
                data,
              )
            }
          }

          const call = (saveCache: (data: any) => void = (data: any): void => {
            if (data) {
              // ...do nothing
            }
          }) => {
            const res = ins.apply(target, args)
            if (res instanceof Promise) {
              return new Promise((resolve, reject) => {
                res
                  .then((data) => {
                    showLog(data)
                    saveCache(data)
                    resolve(data)
                  })
                  .catch((err) => {
                    showError(err)
                    reject(err)
                  })
              })
            }
            else {
              showLog(res)
              saveCache(res)
              return res
            }
          }

          // 不能使用箭头函数，获取到的 arguments 不是请求的
          try {
            if (ins.methodCache) {
              const ttl = ins.methodCacheTTL
              const compiled = template(ins.methodCacheKey)
              const key = compiled(args)

              const data = getCache().get(key)
              if (data) {
                Trace.debug('hit cache', key, data)
                return Promise.resolve(data)
              }
              else {
                Trace.debug('miss cache', key)
              }
              return call((v: any) => {
                Trace.debug('save cache', key, v, ttl)
                getCache().put(key, v, ttl)
              })
            }
            else {
              return call()
            }
          }
          catch (err) {
            showError(err)
            throw err
          }
        }
      }
      else {


        // 非方法对象，直接返回
        return ins
      }
    },
  })
}
