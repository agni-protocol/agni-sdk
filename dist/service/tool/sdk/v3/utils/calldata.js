"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHex = void 0;
/**
 * Converts a big int to a hex string
 * @param bigintIsh
 * @returns The hex encoded calldata
 */
function toHex(bigintIsh) {
    const bigInt = BigInt(bigintIsh);
    let hex = bigInt.toString(16);
    if (hex.length % 2 !== 0)
        hex = `0${hex}`;
    return `0x${hex}`;
}
exports.toHex = toHex;
