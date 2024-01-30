"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInfo = void 0;
const ethers_1 = require("ethers");
const ConnectInfo_1 = require("../../ConnectInfo");
const api_1 = require("../api");
const tool_1 = require("../tool");
/**
 * 地址信息
 */
class AddressInfo {
    getApi() {
        if (typeof this.api === 'undefined')
            this.api = (0, tool_1.createProxy)(new api_1.ApiProvider());
        return this.api;
    }
    readonlyConnectInfo() {
        if (typeof this.readonlyConnectInfoInstance === 'undefined') {
            const provider = new ethers_1.JsonRpcProvider(this.rpc, this.chainId, { staticNetwork: new ethers_1.Network(this.chainName, this.chainId), batchMaxCount: 1 });
            const connectInfo = new ConnectInfo_1.ConnectInfo();
            connectInfo.provider = provider;
            connectInfo.wallet = undefined;
            connectInfo.status = true;
            connectInfo.addressInfo = this;
            connectInfo.writeState = false;
            this.readonlyConnectInfoInstance = connectInfo;
        }
        return this.readonlyConnectInfoInstance;
    }
    getEtherscanAddress(address) {
        return this.getEtherscanLink(address, 'address');
    }
    getEtherscanTx(tx) {
        return this.getEtherscanLink(tx, 'transaction');
    }
    getEtherscanLink(data, type) {
        const prefix = this.scan;
        switch (type) {
            case 'transaction': {
                return `${prefix}/tx/${data}`;
            }
            case 'token': {
                return `${prefix}/token/${data}`;
            }
            case 'block': {
                return `${prefix}/block/${data}`;
            }
            case 'address':
            default: {
                return `${prefix}/address/${data}`;
            }
        }
    }
}
exports.AddressInfo = AddressInfo;
