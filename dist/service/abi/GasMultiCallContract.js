"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasMultiCallContract = void 0;
const tool_1 = require("../tool");
const mulcall_1 = require("../../mulcall");
const abi_1 = require("../../abi");
const BaseAbi_1 = require("./BaseAbi");
let GasMultiCallContract = class GasMultiCallContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.gasMulticall, abi_1.GasLimitMulticall);
    }
    async multicall(callRequests) {
        const splitCallsIntoChunks = (calls) => {
            const chunks = [[]];
            const gasLimit = Number.parseInt(Number(mulcall_1.MAX_GAS_LIMIT * 0.9).toString());
            let gasLeft = gasLimit;
            for (const callRequest of calls) {
                const { target, callData, gasLimit: gasCostLimit } = callRequest;
                const singleGasLimit = gasCostLimit;
                const currentChunk = chunks[chunks.length - 1];
                if (singleGasLimit > gasLeft) {
                    chunks.push([callRequest]);
                    gasLeft = gasLimit - singleGasLimit;
                    // Single call exceeds the gas limit
                    if (gasLeft < 0) {
                        throw new Error(`Multicall request may fail as the gas cost of a single call exceeds the gas limit ${gasLimit}. Gas cost: ${singleGasLimit}. To: ${target}. Data: ${callData}`);
                    }
                    continue;
                }
                currentChunk.push(callRequest);
                gasLeft -= singleGasLimit;
            }
            return chunks;
        };
        const callRequestsChuck = splitCallsIntoChunks(callRequests);
        try {
            const response = [];
            for (const callChuck of callRequestsChuck) {
                const { returnData, } = await this.contract.multicall.staticCall(callChuck, { gasLimit: mulcall_1.MAX_GAS_LIMIT });
                response.push(...returnData);
            }
            return response;
        }
        catch (e) {
            tool_1.Trace.error('multicall call error', e);
            throw e;
        }
    }
};
exports.GasMultiCallContract = GasMultiCallContract;
exports.GasMultiCallContract = GasMultiCallContract = __decorate([
    (0, tool_1.CacheKey)('GasMultiCallContract'),
    __metadata("design:paramtypes", [Function])
], GasMultiCallContract);
