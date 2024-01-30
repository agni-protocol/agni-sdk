"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAbi = void 0;
const ethers_1 = require("ethers");
const mulcall_1 = require("../../mulcall");
class BaseAbi {
    constructor(connectInfo, address, abi) {
        this.provider = connectInfo.provider;
        this.connectInfo = connectInfo;
        this.addressInfo = connectInfo.addressInfo;
        this.mulContract = new mulcall_1.MulContract(address, abi);
        this.contract = new ethers_1.Contract(address, abi, connectInfo.getWalletOrProvider());
    }
}
exports.BaseAbi = BaseAbi;
