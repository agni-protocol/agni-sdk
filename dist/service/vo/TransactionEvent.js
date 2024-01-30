"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionEvent = void 0;
/**
 * -交易信息
 *
 * 要等待交易上链可以使用   await event.confirm()
 *
 */
class TransactionEvent {
    constructor(connectInfo, hash) {
        this.provider = connectInfo.provider;
        this.connectInfo = connectInfo;
        this._hash = hash;
    }
    /**
     * 获取交易HASH
     */
    hash() {
        return this._hash;
    }
    scan() {
        return `${this.connectInfo.getScan()}/tx/${this._hash}`;
    }
    /**
     * 等待交易上链,如果有错误则会直接抛出 BasicException
     */
    async confirm() {
        const transactionReceipt = await this.connectInfo.tx().checkTransactionError(this._hash);
        return transactionReceipt;
    }
}
exports.TransactionEvent = TransactionEvent;
