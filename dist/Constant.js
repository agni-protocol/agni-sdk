"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAddressInfo = exports.updateCurrentAddressInfo = void 0;
const service_1 = require("./service");
const BasicException_1 = require("./BasicException");
let currentAddressInfo;
function updateCurrentAddressInfo(addressInfo) {
    currentAddressInfo = addressInfo;
    (0, service_1.clearCache)();
}
exports.updateCurrentAddressInfo = updateCurrentAddressInfo;
function getCurrentAddressInfo() {
    if (currentAddressInfo === undefined)
        throw new BasicException_1.BasicException('not initialized');
    return currentAddressInfo;
}
exports.getCurrentAddressInfo = getCurrentAddressInfo;
