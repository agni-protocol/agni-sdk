import type { Route } from '../route';
import type { Currency } from '../../currency';
/**
 * Converts a route to a hex encoded path
 * @param route the v3 path to convert to an encoded path
 * @param exactOutput whether the route should be encoded in reverse, for making exact output swaps
 */
export declare function encodeRouteToPath(route: Route<Currency, Currency>, exactOutput: boolean): string;
