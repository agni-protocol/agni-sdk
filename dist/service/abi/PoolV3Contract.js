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
exports.PoolV3Contract = void 0;
const abi_1 = require("../../abi");
const tool_1 = require("../tool");
const BaseAbi_1 = require("./BaseAbi");
let PoolV3Contract = class PoolV3Contract extends BaseAbi_1.BaseAbi {
    constructor(connectInfo, poolAddress) {
        super(connectInfo, poolAddress, abi_1.IAgniPool);
    }
};
exports.PoolV3Contract = PoolV3Contract;
exports.PoolV3Contract = PoolV3Contract = __decorate([
    (0, tool_1.CacheKey)('PoolV3Contract'),
    __metadata("design:paramtypes", [Function, String])
], PoolV3Contract);
