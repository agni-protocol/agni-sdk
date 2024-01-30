"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenListInfo = exports.TokenPrice = exports.TokenSelectInfo = exports.TokenManagerInfo = exports.TokenManagerAddInfo = exports.StorageTokenListInfo = exports.AgniTokenListSchema = void 0;
const AgniTokenListSchema_json_1 = __importDefault(require("./AgniTokenListSchema.json"));
exports.AgniTokenListSchema = AgniTokenListSchema_json_1.default;
class StorageTokenListInfo {
}
exports.StorageTokenListInfo = StorageTokenListInfo;
class TokenManagerAddInfo {
    constructor() {
        this.import = () => {
        };
    }
}
exports.TokenManagerAddInfo = TokenManagerAddInfo;
class TokenManagerInfo {
    constructor() {
        this.remove = () => {
        };
    }
}
exports.TokenManagerInfo = TokenManagerInfo;
class TokenSelectInfo {
}
exports.TokenSelectInfo = TokenSelectInfo;
class TokenPrice {
    constructor(token, priceUSD, priceMNT) {
        this.token = token;
        this.priceUSD = priceUSD;
        this.priceMNT = priceMNT;
    }
}
exports.TokenPrice = TokenPrice;
class TokenListInfo {
    constructor() {
        this.remove = () => {
        };
        this.updateEnable = () => {
        };
        this.tokenListUrl = () => {
            return `https://tokenlists.org/token-list?url=${this.storageTokenListInfo.url}`;
        };
        this.version = () => {
            return `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`;
        };
    }
}
exports.TokenListInfo = TokenListInfo;
