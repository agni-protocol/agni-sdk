"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VM_TYPE_MAXIMA = exports.VMType = exports.MaxUint256 = exports._10000 = exports._9975 = exports._100 = exports.TEN = exports.FIVE = exports.THREE = exports.TWO = exports.ONE = exports.ZERO = exports.MINIMUM_LIQUIDITY = exports.Rounding = exports.TradeType = exports.ChainId = void 0;
var ChainId;
(function (ChainId) {
    ChainId[ChainId["MANTLE"] = 5000] = "MANTLE";
    ChainId[ChainId["MANTLE_TESTNET"] = 5001] = "MANTLE_TESTNET";
})(ChainId || (exports.ChainId = ChainId = {}));
var TradeType;
(function (TradeType) {
    TradeType[TradeType["EXACT_INPUT"] = 0] = "EXACT_INPUT";
    TradeType[TradeType["EXACT_OUTPUT"] = 1] = "EXACT_OUTPUT";
})(TradeType || (exports.TradeType = TradeType = {}));
var Rounding;
(function (Rounding) {
    Rounding[Rounding["ROUND_DOWN"] = 0] = "ROUND_DOWN";
    Rounding[Rounding["ROUND_HALF_UP"] = 1] = "ROUND_HALF_UP";
    Rounding[Rounding["ROUND_UP"] = 2] = "ROUND_UP";
})(Rounding || (exports.Rounding = Rounding = {}));
exports.MINIMUM_LIQUIDITY = 1000n;
// exports for internal consumption
exports.ZERO = 0n;
exports.ONE = 1n;
exports.TWO = 2n;
exports.THREE = 3n;
exports.FIVE = 5n;
exports.TEN = 10n;
exports._100 = 100n;
exports._9975 = 9975n;
exports._10000 = 10000n;
exports.MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
var VMType;
(function (VMType) {
    VMType["uint8"] = "uint8";
    VMType["uint256"] = "uint256";
})(VMType || (exports.VMType = VMType = {}));
exports.VM_TYPE_MAXIMA = {
    [VMType.uint8]: BigInt('0xff'),
    [VMType.uint256]: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
};
