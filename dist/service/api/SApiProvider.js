"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SApiProvider = void 0;
const BaseApi_1 = require("./BaseApi");
const tool_1 = require("../tool");
let SApiProvider = class SApiProvider {
    async tryRequest(path, method, data, config = {
        headers: {},
    }) {
        try {
            const addressInfo = BaseApi_1.BASE_API.connectInfo().addressInfo;
            const result = await BaseApi_1.BASE_API.request(addressInfo.baseApiUrl + "/s_api" + path, method, data, config);
            return {
                error: false,
                data: result.data
            };
        }
        catch (e) {
            return {
                error: true,
                data: undefined
            };
        }
    }
    async protocolData() {
        return this.tryRequest('/protocolData', 'get', {});
    }
    async chartData() {
        return this.tryRequest('/chartData', 'get', {});
    }
    async topPool() {
        return this.tryRequest('/topPool', 'get', {});
    }
    async topToken() {
        return this.tryRequest('/topToken', 'get', {});
    }
    async topTransactions() {
        return this.tryRequest('/topTransactions', 'get', {});
    }
};
exports.SApiProvider = SApiProvider;
exports.SApiProvider = SApiProvider = __decorate([
    (0, tool_1.CacheKey)('SApiProvider')
], SApiProvider);
