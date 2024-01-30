export class TimeUtils {
  static getDeltaTimestamps(): {
    t24h: number
    t48h: number
    t7d: number
    t14d: number
  } {
    const currentTime = new Date().getTime()
    const t24h = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000) / 1000).toString())
    const t48h = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 2) / 1000).toString())
    const t7d = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 7) / 1000).toString())
    const t14d = Number.parseInt(Number((currentTime - 24 * 60 * 60 * 1000 * 14) / 1000).toString())
    return {
      t24h,
      t48h,
      t7d,
      t14d,
    }
  }
}
