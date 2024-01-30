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
exports.RUSDYContract = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let RUSDYContract = class RUSDYContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.RUSDY, abi_1.RUSDY);
        this.BPS_DENOMINATOR = 10000;
    }
    async wrap(amount) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'wrap', args);
    }
    async unwrap(amount) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'unwrap', args);
    }
    async getRUSDYByShares(_USDYAmount) {
        const amount = new bignumber_js_1.default(_USDYAmount).multipliedBy(1e18).multipliedBy(this.BPS_DENOMINATOR).toFixed();
        return new bignumber_js_1.default(this.contract.getRUSDYByShares(amount).toString()).div(1e18).toFixed();
    }
    async getSharesByRUSDY(_rUSDYAmount) {
        const amount = new bignumber_js_1.default(_rUSDYAmount).multipliedBy(1e18).toFixed();
        return new bignumber_js_1.default(this.contract.getSharesByRUSDY(amount).toString()).div(1e18).div(this.BPS_DENOMINATOR).toFixed();
    }
};
exports.RUSDYContract = RUSDYContract;
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RUSDYContract.prototype, "wrap", null);
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RUSDYContract.prototype, "unwrap", null);
exports.RUSDYContract = RUSDYContract = __decorate([
    (0, tool_1.CacheKey)('RUSDYContract'),
    __metadata("design:paramtypes", [Function])
], RUSDYContract);
