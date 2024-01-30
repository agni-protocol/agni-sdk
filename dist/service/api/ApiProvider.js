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
exports.ApiProvider = void 0;
const tool_1 = require("../tool");
const PoolV3Api_1 = require("./PoolV3Api");
const SwapApi_1 = require("./SwapApi");
const TokenMangerApi_1 = require("./TokenMangerApi");
const BaseApi_1 = require("./BaseApi");
const TransactionHistory_1 = require("./TransactionHistory");
const LaunchpadApi_1 = require("./LaunchpadApi");
const DashboardApi_1 = require("./DashboardApi");
const AgniProjectPartyRewardApi_1 = require("./AgniProjectPartyRewardApi");
const SApiProvider_1 = require("./SApiProvider");
/**
 * 请求基类 详细信息查看
 */
let ApiProvider = class ApiProvider {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    poolV3Api() {
        return (0, tool_1.mixProxy)(PoolV3Api_1.PoolV3Api);
    }
    swapV3Api() {
        return (0, tool_1.mixProxy)(SwapApi_1.SwapApi);
    }
    projectPartyRewardApi() {
        return (0, tool_1.mixProxy)(AgniProjectPartyRewardApi_1.AgniProjectPartyRewardApi);
    }
    tokenMangerApi() {
        return (0, tool_1.mixProxy)(TokenMangerApi_1.TokenMangerApi);
    }
    dashboard() {
        return (0, tool_1.mixProxy)(DashboardApi_1.DashboardApi);
    }
    SApiProvider() {
        return (0, tool_1.mixProxy)(SApiProvider_1.SApiProvider);
    }
    transactionHistory() {
        return TransactionHistory_1.transactionHistory;
    }
    launchpad() {
        return (0, tool_1.mixProxy)(LaunchpadApi_1.LaunchpadApi);
    }
};
exports.ApiProvider = ApiProvider;
exports.ApiProvider = ApiProvider = __decorate([
    (0, tool_1.CacheKey)('ApiProvider'),
    __metadata("design:paramtypes", [])
], ApiProvider);
