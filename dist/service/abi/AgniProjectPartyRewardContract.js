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
exports.AgniProjectPartyRewardContract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
let AgniProjectPartyRewardContract = class AgniProjectPartyRewardContract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo, address) {
        super(connectInfo, address, abi_1.AgniProjectPartyReward);
    }
    async claim() {
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'claim', []);
    }
    async setEpoch(epoch) {
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'setEpoch', [epoch]);
    }
    async setReward(epoch, users, amounts) {
        const value = amounts.map(it => new bignumber_js_1.default(it)).reduce((a, b) => a.plus(b)).toFixed();
        return await this.connectInfo.tx().sendContractTransaction(this.contract, 'setReward', [epoch, users, amounts], { value: value });
    }
};
exports.AgniProjectPartyRewardContract = AgniProjectPartyRewardContract;
exports.AgniProjectPartyRewardContract = AgniProjectPartyRewardContract = __decorate([
    (0, tool_1.CacheKey)('AgniProjectPartyRewardContract'),
    __metadata("design:paramtypes", [Function, String])
], AgniProjectPartyRewardContract);
