"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndParseAddress = void 0;
const tiny_invariant_1 = __importDefault(require("tiny-invariant"));
const tiny_warning_1 = __importDefault(require("tiny-warning"));
const ethers_1 = require("ethers");
// warns if addresses are not checksummed
// eslint-disable-next-line consistent-return
function validateAndParseAddress(address) {
    try {
        const checksummedAddress = (0, ethers_1.getAddress)(address);
        (0, tiny_warning_1.default)(address === checksummedAddress, `${address} is not checksummed.`);
        return checksummedAddress;
    }
    catch (error) {
        (0, tiny_invariant_1.default)(false, `${address} is not a valid address.`);
    }
}
exports.validateAndParseAddress = validateAndParseAddress;
