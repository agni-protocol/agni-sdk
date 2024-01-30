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
exports.IdoPoolContract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let IdoPoolContract = class IdoPoolContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo, address) {
        super(connectInfo, address, abi_1.IdoPool);
    }
    async enroll() {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'enroll', args);
    }
    async presaleDeposit(buyQuota, buyInsurance) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'presaleDeposit', args);
    }
    async publicSaleDeposit(buyInsurance, buyQuota, extraDeposit) {
        // eslint-disable-next-line prefer-rest-params
        const args = Array.from(arguments);
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'publicSaleDeposit', args);
    }
    async claim() {
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claim');
    }
};
exports.IdoPoolContract = IdoPoolContract;
exports.IdoPoolContract = IdoPoolContract = __decorate([
    (0, tool_1.CacheKey)('IdoPoolContract'),
    __metadata("design:paramtypes", [Function, String])
], IdoPoolContract);
