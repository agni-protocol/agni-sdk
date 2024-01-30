import BigNumber from 'bignumber.js';
import type { ConnectInfo } from '../ConnectInfo';
import type { Token } from './tool';
import { BaseService } from './BaseService';
import { Balance, BalanceAndAllowance, type TransactionEvent } from './vo';
export declare class Erc20Service extends BaseService {
    constructor(connectInfo: ConnectInfo);
    /**
     * 获取 ETH/ERC20的余额
     * @param address
     * @param user
     */
    getBalance(address: string, user: string): Promise<{
        amount: string;
        value: string;
        decimal: number;
    }>;
    /**
     * 获取 ETH的余额
     * @param user
     */
    getEthBalance(user: string): Promise<{
        amount: string;
        value: string;
        decimal: number;
    }>;
    /**
     * 获取Token的信息
     * @param address
     */
    getTokenInfo(address: string): Promise<{
        name: string;
        symbol: string;
        decimal: number;
        address: string;
    }>;
    /**
     * 获取ERC20的信息
     * @param addresses
     */
    batchGetTokenInfo(...addresses: string[]): Promise<Array<{
        name: string;
        symbol: string;
        decimal: number;
        decimals: number;
        address: string;
        id: string;
    }>>;
    /**
     * 获取合约币允许操作的金额
     * @param exchangeAddress 交易地址
     * @param tokenAddress 币地址
     * @param userAddress  用户地址
     */
    getAllowance(exchangeAddress: string, tokenAddress: string, userAddress: string): Promise<{
        amount: string;
        decimal: number;
        value: string;
        showApprove: boolean;
    }>;
    /**
     * totalSupply
     * @param tokenAddress 币地址
     */
    totalSupply(tokenAddress: string): Promise<{
        amount: string;
    }>;
    /**
     * 添加允许合约操作的金额
     * @param exchangeAddress
     * @param tokenAddress
     * @return 交易hash
     */
    approve(exchangeAddress: string, tokenAddress: string): Promise<TransactionEvent>;
    /**
     * 根据地址批量获取余额
     * @param user
     * @param tokens
     */
    batchGetBalance(user: string, tokens: string[]): Promise<Record<string, {
        address: string;
        amount: string;
        value: string;
        decimal: number;
    }>>;
    /**
     * ERC20转账
     * @param tokenAddress
     * @param to
     * @param amount
     * @return 交易hash
     */
    transfer(tokenAddress: string, to: string, amount: string | number | BigNumber): Promise<TransactionEvent>;
    /**
     * 根据Token对象批量获取余额
     * @param user
     * @param tokens
     */
    batchGetBalanceInfo(user: string, tokens: Token[]): Promise<Record<string, Balance>>;
    /**
     * 批量获取余额和授权
     * @param user    用户
     * @param spender 授权的地址
     * @param tokens
     */
    batchGetBalanceAndAllowance(user: string, spender: string, tokens: Token[]): Promise<Record<string, BalanceAndAllowance>>;
}
