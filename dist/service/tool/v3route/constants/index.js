"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COST_PER_EXTRA_HOP_V2 = exports.BASE_SWAP_COST_V2 = exports.COST_PER_HOP_V3 = exports.COST_PER_INIT_TICK = exports.BASE_SWAP_COST_V3 = exports.COST_PER_UNINIT_TICK = void 0;
// Cost for crossing an uninitialized tick.
const sdk_1 = require("../../sdk");
exports.COST_PER_UNINIT_TICK = 0n;
function BASE_SWAP_COST_V3(id) {
    switch (id) {
        case sdk_1.ChainId.MANTLE:
        case sdk_1.ChainId.MANTLE_TESTNET:
            // case ChainId.ETHEREUM:
            // case ChainId.GOERLI:
            return 2000n;
        default:
            return 0n;
    }
}
exports.BASE_SWAP_COST_V3 = BASE_SWAP_COST_V3;
function COST_PER_INIT_TICK(id) {
    switch (id) {
        case sdk_1.ChainId.MANTLE:
        case sdk_1.ChainId.MANTLE_TESTNET:
            return 31000n;
        default:
            return 0n;
    }
}
exports.COST_PER_INIT_TICK = COST_PER_INIT_TICK;
function COST_PER_HOP_V3(id) {
    switch (id) {
        case sdk_1.ChainId.MANTLE:
        case sdk_1.ChainId.MANTLE_TESTNET:
            return 80000n;
        default:
            return 0n;
    }
}
exports.COST_PER_HOP_V3 = COST_PER_HOP_V3;
// Constant cost for doing any swap regardless of pools.
exports.BASE_SWAP_COST_V2 = 135000n; // 115000, bumped up by 20_000
// Constant per extra hop in the route.
exports.COST_PER_EXTRA_HOP_V2 = 50000n; // 20000, bumped up by 30_000
__exportStar(require("./poolSelector"), exports);
__exportStar(require("./routeConfig"), exports);
