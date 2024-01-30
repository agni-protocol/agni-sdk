"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const Common_1 = require("../math/Common");
const Constant_1 = require("../../../Constant");
const vo_1 = require("../../vo");
const Tool_1 = require("../Tool");
const baseCurrency_1 = require("./baseCurrency");
/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
class Token extends baseCurrency_1.BaseCurrency {
    static fromSerialized(serializedToken) {
        return new Token(serializedToken.chainId, serializedToken.address, serializedToken.decimals, serializedToken.symbol, serializedToken.name, serializedToken.logoURI);
    }
    constructor(chainId, address, decimals, symbol, name, logoURI) {
        super(chainId, decimals, symbol, name);
        this.address = address;
        this.logoURI = logoURI;
        this.isNative = this.address === vo_1.ETH_ADDRESS;
        this.isToken = !this.isNative;
    }
    /**
     * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
     * @param other other token to compare
     */
    equals(other) {
        return !(0, Tool_1.isNullOrUndefined)(other) && this.chainId === other.chainId && this.address === other.address;
    }
    /**
     * Returns true if the address of this token sorts before the address of the other token
     * @param other other token to compare
     * @throws if the tokens have the same address
     * @throws if the tokens are on different chains
     */
    sortsBefore(other) {
        (0, Common_1.invariant)(this.chainId === other.chainId, 'CHAIN_IDS');
        // console.log('this.address', this.address, other?.address)
        // invariant(this.address !== other?.address, 'ADDRESSES')
        return this.erc20Address().toLowerCase() < other?.erc20Address().toLowerCase();
    }
    get wrapped() {
        if (this.isNative)
            return (0, Constant_1.getCurrentAddressInfo)().getApi().tokenMangerApi().WNATIVE();
        return this;
    }
    get serialize() {
        return {
            address: this.address,
            chainId: this.chainId,
            decimals: this.decimals,
            symbol: this.symbol,
            name: this.name,
            logoURI: this.logoURI,
        };
    }
    erc20Address() {
        return this.address === vo_1.ETH_ADDRESS ? (0, Constant_1.getCurrentAddressInfo)().WMNT : this.address;
    }
    iconUrl() {
        return this.logoURI ? this.logoURI : vo_1.DEFAULT_ICON;
    }
    scanUrl() {
        return this.address === vo_1.ETH_ADDRESS ? '' : (0, Constant_1.getCurrentAddressInfo)().getEtherscanAddress(this.address);
    }
}
exports.Token = Token;
