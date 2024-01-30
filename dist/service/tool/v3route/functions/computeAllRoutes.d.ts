import { Currency } from "../../sdk";
import { Pool } from "../../../vo";
import { BaseRoute } from "../types";
export declare function computeAllRoutes(input: Currency, output: Currency, candidatePools: Pool[], maxHops?: number): BaseRoute[];
