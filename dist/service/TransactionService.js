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
exports.TransactionService = void 0;
const get_1 = __importDefault(require("lodash/get"));
const BasicException_1 = require("../BasicException");
const Constant_1 = require("../Constant");
const tool_1 = require("./tool");
const BaseService_1 = require("./BaseService");
const vo_1 = require("./vo");
const ExtTransactionEvent_1 = require("./vo/ExtTransactionEvent");
let TransactionService = class TransactionService extends BaseService_1.BaseService {
    constructor(connectInfo) {
        super(connectInfo);
        this.defaultErrorMsg = 'Please try again. Confirm the transaction and make sure you are paying enough gas!';
    }
    /**
     * 检查交易
     * @param txId
     */
    async checkTransactionError(txId) {
        let count = 1000;
        while (count >= 0) {
            const res = await (0, tool_1.retry)(async () => {
                return await this.provider.getTransactionReceipt(txId);
            });
            tool_1.Trace.debug('checkTransactionError', res);
            if (res && res.status !== null && res.hash.toLowerCase() === txId.toLowerCase()) {
                if (res.status) {
                    return res;
                }
                else {
                    const errorRes = await this.transactionErrorHandler(txId);
                    throw new BasicException_1.BasicException(errorRes.message, errorRes.error);
                }
            }
            await (0, tool_1.sleep)(tool_1.SLEEP_MS);
            count--;
        }
        throw new BasicException_1.BasicException('Transaction timeout');
    }
    /**
     * 发送交易
     * @param contract
     * @param method
     * @param args
     * @param config
     */
    async sendContractTransaction(contract, method, args = [], config = {}) {
        const currentChain = (0, Constant_1.getCurrentAddressInfo)().chainId;
        const chainId = Number.parseInt((await this.connectInfo.provider.getNetwork()).chainId.toString());
        if (chainId !== currentChain)
            throw new BasicException_1.BasicException(`Check your wallet network chain id = ${currentChain}!`);
        if (this.connectInfo.connectMethod === 'EXT') {
            return await this.sendExtTransaction(contract, method, args, config);
        }
        return await this.sendRpcTransaction(contract, method, args, config);
    }
    async sendRpcTransaction(contract, method, args, config) {
        try {
            const estimatedGasLimit = await contract[method].estimateGas(...args, config);
            config.gasLimit = (0, tool_1.calculateGasMargin)(estimatedGasLimit.toString());
            const awaitTransactionResponse = contract[method];
            const response = await awaitTransactionResponse(...args, config);
            return new vo_1.TransactionEvent(this.connectInfo, response.hash);
        }
        catch (e) {
            throw new BasicException_1.BasicException(this.convertErrorMsg(e), e);
        }
    }
    async sendExtTransaction(contract, method, args, config) {
        try {
            // const estimatedGasLimit = await contract[method].estimateGas(...args, {
            //   ...config,
            //   from: this.connectInfo.account,
            // })
            // config.gasLimit = calculateGasMargin(estimatedGasLimit.toString())
            const data = contract.interface.encodeFunctionData(method, args);
            return new ExtTransactionEvent_1.ExtTransactionEvent(this.connectInfo, data, {
                ...config,
                from: this.connectInfo.account,
                to: await contract.getAddress(),
            });
        }
        catch (e) {
            throw new BasicException_1.BasicException(this.convertErrorMsg(e), e);
        }
    }
    convertErrorMsg(e) {
        tool_1.Trace.error('ERROR', e);
        let recursiveErr = e;
        let reason;
        // for MetaMask
        if ((0, get_1.default)(recursiveErr, 'data.message')) {
            reason = (0, get_1.default)(recursiveErr, 'data.message');
        }
        else {
            // https://github.com/Uniswap/interface/blob/ac962fb00d457bc2c4f59432d7d6d7741443dfea/src/hooks/useSwapCallback.tsx#L216-L222
            while (recursiveErr) {
                reason
                    = (0, get_1.default)(recursiveErr, 'reason')
                        || (0, get_1.default)(recursiveErr, 'data.message')
                        || (0, get_1.default)(recursiveErr, 'message')
                        || (0, get_1.default)(recursiveErr, 'info.error.message')
                        || reason;
                recursiveErr = (0, get_1.default)(recursiveErr, 'error') || (0, get_1.default)(recursiveErr, 'data.originalError') || (0, get_1.default)(recursiveErr, 'info');
            }
        }
        reason = reason || this.defaultErrorMsg;
        const REVERT_STR = 'execution reverted: ';
        const indexInfo = reason.indexOf(REVERT_STR);
        const isRevertedError = indexInfo >= 0;
        if (isRevertedError)
            reason = reason.substring(indexInfo + REVERT_STR.length);
        let msg = reason;
        /* if (msg === 'AMM._update: TRADINGSLIPPAGE_TOO_LARGE_THAN_LAST_TRANSACTION') {
          msg = 'Trading slippage is too large.';
        } else if (msg === 'Amm.burn: INSUFFICIENT_LIQUIDITY_BURNED') {
          msg = "The no. of tokens you're removing is too small.";
        } else if (msg === 'FORBID_INVITE_YOURSLEF') {
          msg = 'Forbid Invite Yourself';
        } else if (msg.lastIndexOf('INSUFFICIENT_QUOTE_AMOUNT') > 0) {
          msg = 'Slippage is too large now, try again later';
        }
        // 不正常的提示
        else */
        if (!/[A-Za-z0-9\\. _\\:：%]+/.test(msg))
            msg = this.defaultErrorMsg;
        return msg;
    }
    /**
     *
     * @param txId
     * @param message
     */
    async transactionErrorHandler(txId, message = this.defaultErrorMsg) {
        let error;
        let errorCode = '';
        try {
            const txData = await this.provider.getTransaction(txId);
            try {
                const s = await this.provider.call(txData);
                tool_1.Trace.debug(s);
            }
            catch (e) {
                errorCode = this.convertErrorMsg(e);
                error = e;
                tool_1.Trace.debug('TransactionService.transactionErrorHandler error ', txId, e);
            }
        }
        catch (e) {
            error = e;
            tool_1.Trace.debug('TransactionService.transactionErrorHandler error ', txId, e);
        }
        if (errorCode !== '')
            message = errorCode;
        return {
            error,
            message,
        };
    }
    /**
     * 等待几个区块
     * @param web3
     * @param count
     */
    async sleepBlock(count = 1) {
        const fistBlock = await (0, tool_1.retry)(async () => {
            return await this.provider.getBlockNumber();
        });
        while (true) {
            const lastBlock = await (0, tool_1.retry)(async () => {
                return await this.provider.getBlockNumber();
            });
            if (lastBlock - fistBlock >= count)
                return;
            await (0, tool_1.sleep)(tool_1.SLEEP_MS);
        }
    }
};
exports.TransactionService = TransactionService;
__decorate([
    (0, tool_1.EnableProxy)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "checkTransactionError", null);
__decorate([
    (0, tool_1.EnableProxy)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, String, Array, Object]),
    __metadata("design:returntype", Promise)
], TransactionService.prototype, "sendContractTransaction", null);
exports.TransactionService = TransactionService = __decorate([
    (0, tool_1.CacheKey)('TransactionService'),
    __metadata("design:paramtypes", [Function])
], TransactionService);
