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
exports.StakingPoolContract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let StakingPoolContract = class StakingPoolContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.launchpadStakePool, abi_1.IStakingPool);
    }
    async stakeNativeToken(tokenIdOrAmount) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'stakeNativeToken', [], { value: tokenIdOrAmount });
    }
    async unstake(stakeIds) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'unstake', args);
    }
};
exports.StakingPoolContract = StakingPoolContract;
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StakingPoolContract.prototype, "stakeNativeToken", null);
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], StakingPoolContract.prototype, "unstake", null);
exports.StakingPoolContract = StakingPoolContract = __decorate([
    (0, tool_1.CacheKey)('StakingPoolContract'),
    __metadata("design:paramtypes", [Function])
], StakingPoolContract);
