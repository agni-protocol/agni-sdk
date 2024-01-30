export declare class DashboardMath {
    static get2DayChange: (valueNow: string, value24HoursAgo: string, value48HoursAgo: string) => [number, number];
    /**
     * get standard percent change between two values
     * @param {*} valueNow
     * @param {*} value24HoursAgo
     */
    static getPercentChange: (valueNow: string | undefined | number, value24HoursAgo: string | undefined | number) => number;
}
