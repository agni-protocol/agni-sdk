import {Trace} from "./Tool";

export class Cache {
  static readonly DEFAULT_TTL: number = 10 * 1000
  static readonly ETERNITY_TTL: number = 100 * 365 * 24 * 60 * 60 * 1000

  ttl: number = 0
  data: Record<string, any> = {}

  constructor(ttl: number) {
    this.ttl = ttl
  }

  now() {
    return (new Date()).getTime()
  }

  nuke(key: string) {
    delete this.data[key]
    return this
  }

  get(key: string) {
    let val = null
    const obj = this.data[key]
    if (obj) {
      if (obj.expires === 0 || this.now() < obj.expires) {
        val = obj.val
      }
      else {
        val = null
        this.nuke(key)
      }
    }
    return val
  }

  getByCreate(key: string,create:()=>[any,number]) {
    let val = this.get(key)
    if (val) {
      return val
    }else {
      const [v,ttl] = create()
      this.put(key,v,ttl)
      val = v
    }
    return val
  }

  del(key: string) {
    const oldVal = this.get(key)
    this.nuke(key)
    return oldVal
  }

  put(key: string, val: any = null, ttl: number = 0) {
    if (ttl === 0)
      ttl = this.ttl

    const expires = (ttl === 0) ? 0 : (this.now() + ttl)
    const oldVal = this.del(key)
    if (val !== null) {
      this.data[key] = {
        expires,
        val,
      }
    }
    return oldVal
  }

}

let cache = new Cache(Cache.DEFAULT_TTL)

export function clearCache() {
  cache = new Cache((Cache.DEFAULT_TTL))
  Trace.debug('clear cache')
}

export function getCache(): Cache {
  return cache
}
