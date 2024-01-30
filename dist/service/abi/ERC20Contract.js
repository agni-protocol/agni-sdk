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
exports.ERC20Contract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let ERC20Contract = class ERC20Contract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo, token) {
        super(connectInfo, token, abi_1.IERC20);
    }
    async allowance(owner, sender) {
        return (await this.contract.allowance(owner, sender)).toString();
    }
    async approve(spender, value) {
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'approve', [spender, value], {});
    }
    async transfer(to, value) {
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'transfer', [to, value], {});
    }
    async transferFrom(from, to, value) {
        return await this.connectInfo
            .tx()
            .sendContractTransaction(this.contract, 'transferFrom', [from, to, value], {});
    }
    async totalSupply() {
        return (await this.contract.totalSupply()).toString();
    }
    async balanceOf(owner) {
        return (await this.contract.balanceOf(owner)).toString();
    }
    async name() {
        return (await this.contract.name()).toString();
    }
    async symbol() {
        return (await this.contract.symbol()).toString();
    }
    async decimals() {
        return Number.parseInt((await this.contract.decimals()).toString(), 10);
    }
};
exports.ERC20Contract = ERC20Contract;
exports.ERC20Contract = ERC20Contract = __decorate([
    (0, tool_1.CacheKey)('ERC20Contract'),
    __metadata("design:paramtypes", [Function, String])
], ERC20Contract);
