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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCallContract = void 0;
const fromPairs_1 = __importDefault(require("lodash/fromPairs"));
const toPairs_1 = __importDefault(require("lodash/toPairs"));
const tool_1 = require("../tool");
const abi_1 = require("../../abi");
const mulcall_1 = require("../../mulcall");
const BaseAbi_1 = require("./BaseAbi");
let MultiCallContract = class MultiCallContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.multicall, abi_1.Multicall2);
    }
    async singleCall(shapeWithLabel) {
        const [res] = await this.call(...[shapeWithLabel]);
        return res;
    }
    async call(...shapeWithLabels) {
        if (shapeWithLabels.length === 0) {
            return [];
        }
        const calls = [];
        shapeWithLabels.forEach((relay) => {
            const pairs = (0, toPairs_1.default)(relay);
            pairs.forEach(([, value]) => {
                if (typeof value !== 'string')
                    calls.push(value);
            });
        });
        const res = await (0, mulcall_1.multicallExecute)(this.contract, calls);
        let index = 0;
        const datas = shapeWithLabels.map((relay) => {
            const pairs = (0, toPairs_1.default)(relay);
            pairs.forEach((obj) => {
                if (typeof obj[1] !== 'string') {
                    obj[1] = res[index];
                    index++;
                }
            });
            return (0, fromPairs_1.default)(pairs);
        });
        return datas;
    }
};
exports.MultiCallContract = MultiCallContract;
exports.MultiCallContract = MultiCallContract = __decorate([
    (0, tool_1.CacheKey)('MultiCallContract'),
    __metadata("design:paramtypes", [Function])
], MultiCallContract);
