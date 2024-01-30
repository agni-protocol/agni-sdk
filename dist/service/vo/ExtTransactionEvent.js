"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtTransactionEvent = void 0;
const TransactionEvent_1 = require("./TransactionEvent");
class ExtTransactionEvent extends TransactionEvent_1.TransactionEvent {
    constructor(connectInfo, data, config) {
        super(connectInfo, '');
        this._data = data;
        this._config = config;
    }
    get data() {
        return this._data;
    }
    get config() {
        return this._config;
    }
    async confirm() {
        throw new Error('ExtTransactionEvent.confirm() not implemented');
    }
}
exports.ExtTransactionEvent = ExtTransactionEvent;
