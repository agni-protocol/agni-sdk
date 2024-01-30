"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionHistory = exports.TransactionHistory = void 0;
const tool_1 = require("../tool");
const BaseApi_1 = require("./BaseApi");
class TransactionHistory {
    constructor() {
        this.baseApi = BaseApi_1.BASE_API;
    }
    getKey(connectInfo) {
        return `${connectInfo.chainId}-${connectInfo.account}`;
    }
    initUpdateTransaction(connectInfo, start) {
        if (start) {
            TransactionHistory.connect = connectInfo;
            TransactionHistory.start = start;
            this.startUpdateTransaction();
        }
        else {
            TransactionHistory.connect = undefined;
            TransactionHistory.start = start;
            if ((TransactionHistory.timoutId))
                clearTimeout(TransactionHistory.timoutId);
        }
    }
    startUpdateTransaction() {
        if ((TransactionHistory.timoutId))
            clearTimeout(TransactionHistory.timoutId);
        if (TransactionHistory.start && TransactionHistory.connect) {
            TransactionHistory.timoutId = setTimeout(async () => {
                try {
                    await this.updateTransaction(TransactionHistory.connect);
                }
                finally {
                    this.startUpdateTransaction();
                }
            }, 5000);
        }
        else {
            TransactionHistory.timoutId = undefined;
        }
    }
    async updateTransaction(connectInfo) {
        const transactions = this.storageHistories(connectInfo);
        const storageRecentTransactions = transactions.filter(it => it.status === 'pending');
        for (const storageRecentTransaction of storageRecentTransactions) {
            try {
                await connectInfo.tx().checkTransactionError(storageRecentTransaction.txHash);
                storageRecentTransaction.status = 'success';
            }
            catch (e) {
                storageRecentTransaction.status = 'fail';
            }
        }
        this.update(connectInfo, storageRecentTransactions);
    }
    saveHistory(connectInfo, event, saveData) {
        try {
            if (event.hash() === '') {
                return;
            }
            const transactions = this.storageHistories(connectInfo);
            const data = {
                index: transactions.length,
                txHash: event.hash(),
                chainId: connectInfo.chainId,
                token0: saveData.token0,
                token1: saveData.token1,
                token0Amount: saveData.token0Amount,
                token1Amount: saveData.token1Amount,
                type: saveData.type,
                time: new Date().getTime(),
                to: saveData.to || connectInfo.account,
                status: 'pending',
            };
            transactions.push(data);
            this.baseApi.address().storage.setJson(this.getKey(connectInfo), transactions);
        }
        catch (e) {
            tool_1.Trace.error('TransactionHistory:saveHistory error ', e);
        }
    }
    histories(connectInfo) {
        const storageRecentTransactions = this.storageHistories(connectInfo);
        return Array.from(storageRecentTransactions).reverse().map((it) => {
            const chainName = connectInfo.addressInfo.chainName;
            let title = '';
            switch (it.type) {
                case 'remove':
                    title = `Remove ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`;
                    break;
                case 'add':
                    title = `Add ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`;
                    break;
                case 'collect_fee':
                    title = `Collect Fee ${it.token0Amount} ${it.token0.symbol} for ${it.token1Amount} ${it.token1.symbol} to ${it.to}`;
                    break;
                case 'swap':
                    title = `Swap ${it.token0Amount} ${it.token0.symbol} for min.${it.token1Amount} ${it.token1.symbol} to ${it.to}`;
                    break;
            }
            return {
                ...it,
                hashUrl: connectInfo.addressInfo.getEtherscanTx(it.txHash),
                title,
                chainName,
            };
        });
    }
    removeByTxHash(connectInfo, txHash) {
        this.baseApi.address().storage.setJson(this.getKey(connectInfo), this.storageHistories(connectInfo)
            .filter(it => it.txHash === txHash));
    }
    removeByIndex(connectInfo, index) {
        this.baseApi.address().storage.setJson(this.getKey(connectInfo), this.storageHistories(connectInfo)
            .filter(it => it.index === index));
    }
    update(connectInfo, transactions) {
        const storageRecentTransactions = this.storageHistories(connectInfo);
        for (const it of transactions) {
            if (storageRecentTransactions[it.index].txHash === it.txHash)
                storageRecentTransactions[it.index] = it;
        }
        this.baseApi.address().storage.setJson(this.getKey(connectInfo), storageRecentTransactions);
    }
    removeAll(connectInfo) {
        this.baseApi.address().storage.setJson(this.getKey(connectInfo), []);
    }
    storageHistories(connectInfo) {
        return this.baseApi.address().storage.getArray(this.getKey(connectInfo)) || [];
    }
}
exports.TransactionHistory = TransactionHistory;
const transactionHistory = new TransactionHistory();
exports.transactionHistory = transactionHistory;
