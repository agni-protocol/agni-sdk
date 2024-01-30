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
exports.Erc20Service = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const tool_1 = require("./tool");
const BaseService_1 = require("./BaseService");
const vo_1 = require("./vo");
const abi_1 = require("./abi");
let Erc20Service = class Erc20Service extends BaseService_1.BaseService {
    constructor(connectInfo) {
        super(connectInfo);
    }
    /**
     * 获取 ETH/ERC20的余额
     * @param address
     * @param user
     */
    async getBalance(address, user) {
        if (address === vo_1.ETH_ADDRESS)
            return await this.getEthBalance(user);
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, address);
        const result = await this.connectInfo.multiCall().singleCall({
            balance: tokenIns.mulContract.balanceOf(user),
            decimals: tokenIns.mulContract.decimals(),
        });
        const decimal = Number(result.decimals);
        const amount = new bignumber_js_1.default(result.balance).dividedBy(new bignumber_js_1.default(10).pow(decimal)).toFixed();
        tool_1.Trace.debug('Get ERC20 balance', user, result);
        return {
            amount,
            value: result.balance,
            decimal,
        };
    }
    /**
     * 获取 ETH的余额
     * @param user
     */
    async getEthBalance(user) {
        const balance = await this.connectInfo.provider.getBalance(user);
        const decimal = 18;
        const amount = new bignumber_js_1.default(balance.toString()).dividedBy(new bignumber_js_1.default(10).pow(decimal)).toFixed();
        tool_1.Trace.debug('Get ETH balance', user, balance);
        return {
            amount,
            value: balance.toString(),
            decimal,
        };
    }
    /**
     * 获取Token的信息
     * @param address
     */
    async getTokenInfo(address) {
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, address);
        const result = await this.connectInfo.multiCall().singleCall({
            name: tokenIns.mulContract.name(),
            symbol: tokenIns.mulContract.symbol(),
            decimal: tokenIns.mulContract.decimals(),
            address: address.toLowerCase(),
        });
        return {
            name: result.name,
            symbol: result.symbol,
            decimal: Number.parseInt(result.decimal, 10),
            address: result.address,
        };
    }
    /**
     * 获取ERC20的信息
     * @param addresses
     */
    async batchGetTokenInfo(...addresses) {
        const [...resultList] = await this.connectInfo.multiCall().call(...addresses.map((erc20Address) => {
            if (erc20Address === vo_1.ETH_ADDRESS) {
                return {
                    name: vo_1.ETH_ADDRESS,
                    symbol: vo_1.ETH_ADDRESS,
                    decimals: '18',
                    address: vo_1.ETH_ADDRESS,
                };
            }
            const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, erc20Address);
            return {
                name: tokenIns.mulContract.name(),
                symbol: tokenIns.mulContract.symbol(),
                decimals: tokenIns.mulContract.decimals(),
                address: erc20Address.toLowerCase(),
            };
        }));
        return resultList.map((result) => {
            const data = {
                name: result.name,
                symbol: result.symbol,
                decimal: Number(result.decimals),
                decimals: Number(result.decimals),
                address: result.address,
                id: result.address,
            };
            tool_1.Trace.debug('Get currency information', data);
            return data;
        });
    }
    /**
     * 获取合约币允许操作的金额
     * @param exchangeAddress 交易地址
     * @param tokenAddress 币地址
     * @param userAddress  用户地址
     */
    async getAllowance(exchangeAddress, tokenAddress, userAddress) {
        if (tokenAddress === vo_1.ETH_ADDRESS) {
            return {
                amount: tool_1.MAXIMUM_U256,
                value: tool_1.MAXIMUM_U256,
                decimal: 18,
                showApprove: false,
            };
        }
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, tokenAddress);
        const result = await this.connectInfo.multiCall().singleCall({
            allowance: tokenIns.mulContract.allowance(userAddress, exchangeAddress),
            decimals: tokenIns.mulContract.decimals(),
        });
        const allowanceBalance = result.allowance;
        const decimal = Number(result.decimals);
        const amount = new bignumber_js_1.default(allowanceBalance).div(10 ** decimal);
        tool_1.Trace.debug('Get Allowance Amount', exchangeAddress, tokenAddress, userAddress, result, decimal, amount.toFixed());
        return {
            amount: amount.toFixed(),
            value: allowanceBalance,
            decimal,
            showApprove: new bignumber_js_1.default(amount).comparedTo('100000000') <= 0,
        };
    }
    /**
     * totalSupply
     * @param tokenAddress 币地址
     */
    async totalSupply(tokenAddress) {
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, tokenAddress);
        const value = await tokenIns.totalSupply();
        tool_1.Trace.debug('Get totalSupply Amount', value);
        return {
            amount: value.toString(),
        };
    }
    /**
     * 添加允许合约操作的金额
     * @param exchangeAddress
     * @param tokenAddress
     * @return 交易hash
     */
    async approve(exchangeAddress, tokenAddress) {
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, tokenAddress);
        return await tokenIns.approve(exchangeAddress, tool_1.MAXIMUM_U256);
    }
    /**
     * 根据地址批量获取余额
     * @param user
     * @param tokens
     */
    async batchGetBalance(user, tokens) {
        const multiCall = this.connectInfo.create(abi_1.MultiCallContract);
        const result = await this.connectInfo.multiCall().call(...tokens.map((it) => {
            if (it === vo_1.ETH_ADDRESS) {
                return {
                    address: vo_1.ETH_ADDRESS,
                    balance: multiCall.mulContract.getEthBalance(user),
                    decimals: '18',
                };
            }
            const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, it);
            return {
                address: it,
                balance: tokenIns.mulContract.balanceOf(user),
                decimals: tokenIns.mulContract.decimals(),
            };
        }));
        const data = {};
        result.forEach((it) => {
            data[it.address] = {
                address: it.address,
                amount: new bignumber_js_1.default(it.balance || '0').div(10 ** Number.parseInt(it.decimals || '0', 10)).toFixed(),
                value: it.balance || '0',
                decimal: Number.parseInt(it.decimals || '0', 10),
            };
        });
        return data;
    }
    /**
     * ERC20转账
     * @param tokenAddress
     * @param to
     * @param amount
     * @return 交易hash
     */
    async transfer(tokenAddress, to, amount) {
        const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, tokenAddress);
        const decimal = await tokenIns.decimals();
        const value = new bignumber_js_1.default(amount).multipliedBy(10 ** decimal).toFixed(0, bignumber_js_1.default.ROUND_DOWN);
        return await tokenIns.transfer(to, value);
    }
    /**
     * 根据Token对象批量获取余额
     * @param user
     * @param tokens
     */
    async batchGetBalanceInfo(user, tokens) {
        const multiCall = this.connectInfo.create(abi_1.MultiCallContract);
        const result = await this.connectInfo.multiCall().call(...tokens.map((it) => {
            if (it.address === vo_1.ETH_ADDRESS) {
                return {
                    address: vo_1.ETH_ADDRESS,
                    balance: multiCall.mulContract.getEthBalance(user),
                    decimals: Number(it.decimals).toFixed(),
                };
            }
            const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, it);
            return {
                address: it.address,
                balance: tokenIns.mulContract.balanceOf(user),
                decimals: Number(it.decimals).toFixed(),
            };
        }));
        const data = {};
        result.forEach((it, index) => {
            data[it.address] = new vo_1.Balance(tokens[index], user, new bignumber_js_1.default(it.balance).div(10 ** it.decimals).toFixed());
        });
        return data;
    }
    /**
     * 批量获取余额和授权
     * @param user    用户
     * @param spender 授权的地址
     * @param tokens
     */
    async batchGetBalanceAndAllowance(user, spender, tokens) {
        const multiCall = this.connectInfo.create(abi_1.MultiCallContract);
        const result = await this.connectInfo.multiCall().call(...tokens.map((it) => {
            if (it.address === vo_1.ETH_ADDRESS) {
                return {
                    address: vo_1.ETH_ADDRESS,
                    balance: multiCall.mulContract.getEthBalance(user),
                    allowance: '0',
                    decimals: Number(it.decimals).toFixed(),
                };
            }
            const tokenIns = this.connectInfo.create(abi_1.ERC20Contract, it.address);
            return {
                address: it.address,
                balance: tokenIns.mulContract.balanceOf(user),
                allowance: tokenIns.mulContract.allowance(user, spender),
                decimals: Number(it.decimals).toFixed(),
            };
        }));
        const data = {};
        result.forEach((it, index) => {
            data[it.address] = new vo_1.BalanceAndAllowance(tokens[index], user, new bignumber_js_1.default(it.balance).div(10 ** it.decimals).toFixed(), new bignumber_js_1.default(it.allowance).div(10 ** it.decimals).toFixed(), spender);
        });
        return data;
    }
};
exports.Erc20Service = Erc20Service;
exports.Erc20Service = Erc20Service = __decorate([
    (0, tool_1.CacheKey)('Erc20Service'),
    __metadata("design:paramtypes", [Function])
], Erc20Service);
