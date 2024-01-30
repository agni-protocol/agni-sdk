"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeRouteToPath = void 0;
const ethers_1 = require("ethers");
/**
 * Converts a route to a hex encoded path
 * @param route the v3 path to convert to an encoded path
 * @param exactOutput whether the route should be encoded in reverse, for making exact output swaps
 */
function encodeRouteToPath(route, exactOutput) {
    const firstInputToken = route.input.wrapped;
    const { path, types } = route.pools.reduce(({ inputToken, path, types }, pool, index) => {
        const outputToken = pool.token0.equals(inputToken) ? pool.token1 : pool.token0;
        if (index === 0) {
            return {
                inputToken: outputToken,
                types: ['address', 'uint24', 'address'],
                path: [inputToken.erc20Address(), pool.fee, outputToken.erc20Address()],
            };
        }
        return {
            inputToken: outputToken,
            types: [...types, 'uint24', 'address'],
            path: [...path, pool.fee, outputToken.erc20Address()],
        };
    }, { inputToken: firstInputToken, path: [], types: [] });
    //
    // return exactOutput ? encodePacked(types.reverse(), path.reverse()) : encodePacked(types, path)
    // 用ether.js实现
    return exactOutput ? (0, ethers_1.solidityPacked)(types.reverse(), path.reverse()) : (0, ethers_1.solidityPacked)(types, path);
}
exports.encodeRouteToPath = encodeRouteToPath;
