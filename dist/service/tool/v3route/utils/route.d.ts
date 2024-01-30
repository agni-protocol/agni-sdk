import { Pool } from "../../../vo";
import { Currency, Price } from "../../sdk";
import { BaseRoute, Route } from "../types";
export declare function buildBaseRoute(pools: Pool[], currencyIn: Currency, currencyOut: Currency): BaseRoute;
export declare function getQuoteCurrency({ input, output }: BaseRoute, baseCurrency: Currency): import("../../sdk").Token;
export declare function getMidPrice({ path, pools }: Route): Price<import("../../sdk").Token, import("../../sdk").Token>;
