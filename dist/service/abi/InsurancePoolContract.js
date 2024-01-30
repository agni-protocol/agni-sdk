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
exports.InsurancePoolContract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let InsurancePoolContract = class InsurancePoolContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo) {
        super(connectInfo, connectInfo.addressInfo.launchpadInsurancePool, abi_1.InsurancePool);
    }
    // function claimLoss(uint256 insuranceId) external;
    async claimLoss(insuranceId) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claimLoss', args);
    }
};
exports.InsurancePoolContract = InsurancePoolContract;
__decorate([
    (0, tool_1.EnableLogs)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InsurancePoolContract.prototype, "claimLoss", null);
exports.InsurancePoolContract = InsurancePoolContract = __decorate([
    (0, tool_1.CacheKey)('InsurancePoolContract'),
    __metadata("design:paramtypes", [Function])
], InsurancePoolContract);
