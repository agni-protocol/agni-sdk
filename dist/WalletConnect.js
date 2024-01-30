"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectManager = exports.WalletConnect = void 0;
const ethers_1 = require("ethers");
const get_1 = __importDefault(require("lodash/get"));
const ConnectInfo_1 = require("./ConnectInfo");
const service_1 = require("./service");
const Constant_1 = require("./Constant");
const BasicException_1 = require("./BasicException");
class WalletConnect {
    async getChainId() {
        const web3Provider = this.wallet;
        return Number.parseInt((await web3Provider.getNetwork()).chainId.toString());
    }
    async getAccount() {
        const web3Provider = this.wallet;
        return await (await web3Provider.getSigner()).getAddress();
    }
    async getWallet() {
        const web3Provider = this.wallet;
        return await web3Provider.getSigner();
    }
    async getApiProvider() {
        return this.wallet;
    }
    constructor(walletType, provider = undefined) {
        this.wallet = walletType;
        this.provider = provider;
    }
    disConnect() {
        const connectInfo = this.connectInfo;
        connectInfo.status = false;
        connectInfo.msg = 'Check your wallet!';
        this.update();
    }
    update() {
        const connectInfo = this.connectInfo;
        connectInfo.walletConnect = this;
        if (typeof connectInfo.account === 'undefined' || connectInfo.account === '') {
            connectInfo.status = false;
            service_1.transactionHistory.initUpdateTransaction(connectInfo, false);
        }
        const currentAddressInfo = (0, Constant_1.getCurrentAddressInfo)();
        if (connectInfo.status) {
            connectInfo.account = connectInfo.account.toLowerCase();
            connectInfo.addressInfo = currentAddressInfo;
            service_1.Trace.debug('connect success ', this.connectInfo.account, this.connectInfo.chainId);
        }
        if (connectInfo.status) {
            connectInfo.clear();
            service_1.transactionHistory.initUpdateTransaction(connectInfo, true);
        }
    }
    async init() {
        const connectInfo = this.connectInfo;
        connectInfo.chainId = await this.getChainId();
        connectInfo.account = await this.getAccount();
        connectInfo.wallet = await this.getWallet();
        connectInfo.provider = await this.getApiProvider();
        connectInfo.msg = 'success';
        connectInfo.status = true;
        this.update();
    }
    static async connectMetaMask() {
        const _ethereum = WalletConnect.getEthereum();
        if (!_ethereum)
            throw new BasicException_1.BasicException('Check your wallet!');
        await _ethereum.enable();
        const provider = new ethers_1.BrowserProvider(_ethereum, 'any');
        const walletConnect = new WalletConnect(provider);
        walletConnect.provider = _ethereum;
        return walletConnect;
    }
    static getEthereum() {
        return (0, get_1.default)(window, 'ethereum');
    }
    /**
     * 链接钱包
     * @returns ConnectInfo
     */
    async connect() {
        try {
            const connectInfo = new ConnectInfo_1.ConnectInfo();
            connectInfo.status = false;
            connectInfo.msg = 'Check your wallet!';
            this.connectInfo = connectInfo;
            await this.init();
            return this.connectInfo;
        }
        catch (e) {
            this.connectInfo.status = false;
            this.connectInfo.msg = e.message || e.toString();
            this.update();
            throw e;
        }
    }
}
exports.WalletConnect = WalletConnect;
class ConnectManager {
    /**
     * 初始化
     * @param wallet
     */
    static async connect(wallet) {
        ConnectManager.walletConnect = wallet;
        ConnectManager.connectInfo = await wallet.connect();
        return ConnectManager.connectInfo;
    }
    /**
     * 断开连接
     */
    static async disConnect() {
        if (ConnectManager.walletConnect) {
            ConnectManager.walletConnect.disConnect();
            ConnectManager.walletConnect = undefined;
        }
        if (ConnectManager.connectInfo)
            ConnectManager.connectInfo = undefined;
    }
    /**
     * 获取连接
     */
    static getConnect() {
        if (ConnectManager.connectInfo) {
            if (ConnectManager.connectInfo.status)
                return ConnectManager.connectInfo;
        }
        throw new BasicException_1.BasicException('Wallet not connected');
    }
    static addMetamaskChain(chainName) {
        const _ethereum = WalletConnect.getEthereum();
        if (!_ethereum)
            return;
        const data = ConnectManager.chainMap[chainName];
        if (!data)
            return;
        if (typeof data === 'string') {
            _ethereum
                .request({
                method: 'wallet_switchEthereumChain',
                params: [
                    {
                        chainId: data,
                    },
                ],
            })
                .catch();
            return;
        }
        _ethereum.request({ method: 'wallet_addEthereumChain', params: data }).catch();
    }
}
exports.ConnectManager = ConnectManager;
ConnectManager.chainMap = {
    rinkeby: '0x4',
    mainnet: '0x1',
};
