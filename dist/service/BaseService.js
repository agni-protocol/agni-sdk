"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
class BaseService {
    constructor(connectInfo) {
        this.provider = connectInfo.provider;
        this.connectInfo = connectInfo;
        this.addressInfo = connectInfo.addressInfo;
    }
}
exports.BaseService = BaseService;
