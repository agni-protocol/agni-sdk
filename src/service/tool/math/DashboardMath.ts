import BigNumber from 'bignumber.js'

export class DashboardMath {
  static get2DayChange = (valueNow: string, value24HoursAgo: string, value48HoursAgo: string): [number, number] => {
    // get volume info for both 24 hour periods
    const currentChange = new BigNumber(valueNow).minus(value24HoursAgo).toNumber()
    const previousChange = new BigNumber(value24HoursAgo).minus(value48HoursAgo).toNumber()
    const adjustedPercentChange = new BigNumber(currentChange).minus(previousChange).multipliedBy('100').div(previousChange).toNumber()
    if (new BigNumber(adjustedPercentChange).isNaN() || !new BigNumber(adjustedPercentChange).isFinite())
      return [currentChange, 0]

    return [currentChange, adjustedPercentChange]
  }

  /**
   * get standard percent change between two values
   * @param {*} valueNow
   * @param {*} value24HoursAgo
   */
  static getPercentChange = (valueNow: string | undefined | number, value24HoursAgo: string | undefined | number): number => {
    if (valueNow && value24HoursAgo) {
      const change = ((Number.parseFloat((valueNow).toString()) - Number.parseFloat(value24HoursAgo.toString())) / Number.parseFloat(value24HoursAgo.toString())) * 100
      if (Number.isFinite(change))
        return change
    }
    return 0
  }
}
