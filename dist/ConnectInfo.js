"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectInfo = void 0;
const service_1 = require("./service");
const BasicException_1 = require("./BasicException");
class ConnectInfo {
    constructor() {
        this.writeState = true;
        this.connectMethod = 'RPC';
    }
    create(clazz, ...args) {
        return (0, service_1.mixProxyByConnect)(clazz, this, ...args);
    }
    clear() {
        (0, service_1.clearCache)();
    }
    /**
     * 获取 ERC20 API
     */
    erc20() {
        return this.create(service_1.Erc20Service);
    }
    /**
     * 获取交易API
     */
    tx() {
        return this.create(service_1.TransactionService);
    }
    /**
     * multiCall service
     */
    multiCall() {
        return this.create(service_1.MultiCallContract);
    }
    get provider() {
        if (this._status)
            return this._provider;
        throw new BasicException_1.BasicException('Wallet not connected!');
    }
    set provider(value) {
        this._provider = value;
    }
    /**
     * 获取连接的状态
     */
    get status() {
        return this._status;
    }
    set status(value) {
        this._status = value;
    }
    /**
     * 获取连接的消息
     */
    get msg() {
        return this._msg;
    }
    set msg(value) {
        this._msg = value;
    }
    /**
     * 获取连接的地址
     */
    get account() {
        return this._account;
    }
    set account(value) {
        this._account = value;
    }
    /**
     * 获取连接的网络ID
     */
    get chainId() {
        return this._chainId;
    }
    set chainId(value) {
        this._chainId = value;
    }
    /**
     * 获取连接的地址信息
     */
    get addressInfo() {
        return this._addressInfo;
    }
    set addressInfo(value) {
        this._addressInfo = value;
    }
    // eslint-disable-next-line accessor-pairs
    set wallet(value) {
        this._wallet = value;
    }
    getWalletOrProvider() {
        return (this._wallet || this._provider);
    }
    getScan() {
        return this.addressInfo.scan;
    }
    async addToken(tokenAddress) {
        const token = await this.erc20().getTokenInfo(tokenAddress);
        service_1.Trace.debug('token info', token);
        try {
            const wasAdded = await this.provider.send('wallet_watchAsset', {
                type: 'ERC20',
                options: {
                    address: token.address,
                    symbol: token.symbol,
                    decimals: token.decimal,
                },
            });
            if (wasAdded)
                return true;
        }
        catch (error) {
            service_1.Trace.error(error);
        }
        return false;
    }
}
exports.ConnectInfo = ConnectInfo;
