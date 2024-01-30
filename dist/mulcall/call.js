"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multicallExecute = exports.CHUNK_SIZE = exports.QUOTER_TRADE_GAS = exports.MAX_GAS_LIMIT = void 0;
const chunk_1 = __importDefault(require("lodash/chunk"));
const service_1 = require("../service");
const abi_1 = require("./abi");
exports.MAX_GAS_LIMIT = 30000000;
exports.QUOTER_TRADE_GAS = 3000000;
exports.CHUNK_SIZE = 200;
async function multicallExecute(multicall, calls) {
    const callRequests = calls.map((call) => {
        const callData = abi_1.Abi.encode(call.name, call.inputs, call.params);
        return {
            target: call.contract.address,
            callData,
        };
    });
    const callRequestsChuck = (0, chunk_1.default)(callRequests, exports.CHUNK_SIZE);
    try {
        const response = [];
        for (const callChuck of callRequestsChuck) {
            const result = await multicall.tryAggregate.staticCall(false, callChuck, { gasLimit: exports.MAX_GAS_LIMIT });
            response.push(...result);
        }
        const callCount = calls.length;
        const callResult = [];
        for (let i = 0; i < callCount; i++) {
            const outputs = calls[i].outputs;
            const result = response[i];
            if (result.success) {
                const params = abi_1.Abi.decode(outputs, result.returnData);
                callResult.push(params);
            }
            else {
                callResult.push(undefined);
            }
        }
        return callResult;
    }
    catch (e) {
        service_1.Trace.error('multicall call error', e);
        throw e;
    }
}
exports.multicallExecute = multicallExecute;
