import BigNumber from 'bignumber.js'
import type { ConnectInfo } from '../ConnectInfo'
import type { Token } from './tool'
import { CacheKey, MAXIMUM_U256, Trace } from './tool'
import { BaseService } from './BaseService'
import { Balance, BalanceAndAllowance, ETH_ADDRESS, type TransactionEvent } from './vo'
import { ERC20Contract, MultiCallContract } from './abi'

@CacheKey('Erc20Service')
export class Erc20Service extends BaseService {
  constructor(connectInfo: ConnectInfo) {
    super(connectInfo)
  }

  /**
   * 获取 ETH/ERC20的余额
   * @param address
   * @param user
   */
  async getBalance(address: string, user: string): Promise<{ amount: string; value: string; decimal: number }> {
    if (address === ETH_ADDRESS)
      return await this.getEthBalance(user)

    const tokenIns = this.connectInfo.create(ERC20Contract, address)
    const result = await this.connectInfo.multiCall().singleCall({
      balance: tokenIns.mulContract.balanceOf(user),
      decimals: tokenIns.mulContract.decimals(),
    })

    const decimal = Number(result.decimals)
    const amount = new BigNumber(result.balance).dividedBy(new BigNumber(10).pow(decimal)).toFixed()
    Trace.debug('Get ERC20 balance', user, result)
    return {
      amount,
      value: result.balance,
      decimal,
    }
  }

  /**
   * 获取 ETH的余额
   * @param user
   */
  async getEthBalance(user: string): Promise<{ amount: string; value: string; decimal: number }> {
    const balance = await this.connectInfo.provider.getBalance(user)
    const decimal = 18
    const amount = new BigNumber(balance.toString()).dividedBy(new BigNumber(10).pow(decimal)).toFixed()
    Trace.debug('Get ETH balance', user, balance)
    return {
      amount,
      value: balance.toString(),
      decimal,
    }
  }

  /**
   * 获取Token的信息
   * @param address
   */
  async getTokenInfo(address: string): Promise<{ name: string; symbol: string; decimal: number; address: string }> {
    const tokenIns = this.connectInfo.create(ERC20Contract, address)
    const result = await this.connectInfo.multiCall().singleCall({
      name: tokenIns.mulContract.name(),
      symbol: tokenIns.mulContract.symbol(),
      decimal: tokenIns.mulContract.decimals(),
      address: address.toLowerCase(),
    })
    return {
      name: result.name,
      symbol: result.symbol,
      decimal: Number.parseInt(result.decimal, 10),
      address: result.address,
    }
  }

  /**
   * 获取ERC20的信息
   * @param addresses
   */
  async batchGetTokenInfo(
    ...addresses: string[]
  ): Promise<Array<{ name: string; symbol: string; decimal: number; decimals: number; address: string; id: string }>> {
    const [...resultList] = await this.connectInfo.multiCall().call(
      ...addresses.map((erc20Address) => {
        if (erc20Address === ETH_ADDRESS) {
          return {
            name: ETH_ADDRESS,
            symbol: ETH_ADDRESS,
            decimals: '18',
            address: ETH_ADDRESS,
          }
        }

        const tokenIns = this.connectInfo.create(ERC20Contract, erc20Address)
        return {
          name: tokenIns.mulContract.name(),
          symbol: tokenIns.mulContract.symbol(),
          decimals: tokenIns.mulContract.decimals(),
          address: erc20Address.toLowerCase(),
        }
      }),
    )

    return resultList.map((result) => {
      const data = {
        name: result.name,
        symbol: result.symbol,
        decimal: Number(result.decimals),
        decimals: Number(result.decimals),
        address: result.address,
        id: result.address,
      }
      Trace.debug('Get currency information', data)
      return data
    })
  }

  /**
   * 获取合约币允许操作的金额
   * @param exchangeAddress 交易地址
   * @param tokenAddress 币地址
   * @param userAddress  用户地址
   */
  async getAllowance(
    exchangeAddress: string,
    tokenAddress: string,
    userAddress: string,
  ): Promise<{ amount: string; decimal: number; value: string; showApprove: boolean }> {
    if (tokenAddress === ETH_ADDRESS) {
      return {
        amount: MAXIMUM_U256,
        value: MAXIMUM_U256,
        decimal: 18,
        showApprove: false,
      }
    }

    const tokenIns = this.connectInfo.create(ERC20Contract, tokenAddress)
    const result = await this.connectInfo.multiCall().singleCall({
      allowance: tokenIns.mulContract.allowance(userAddress, exchangeAddress),
      decimals: tokenIns.mulContract.decimals(),
    })
    const allowanceBalance = result.allowance
    const decimal = Number(result.decimals)
    const amount = new BigNumber(allowanceBalance).div(10 ** decimal)
    Trace.debug('Get Allowance Amount', exchangeAddress, tokenAddress, userAddress, result, decimal, amount.toFixed())
    return {
      amount: amount.toFixed(),
      value: allowanceBalance,
      decimal,
      showApprove: new BigNumber(amount).comparedTo('100000000') <= 0,
    }
  }

  /**
   * totalSupply
   * @param tokenAddress 币地址
   */
  async totalSupply(tokenAddress: string): Promise<{ amount: string }> {
    const tokenIns = this.connectInfo.create(ERC20Contract, tokenAddress)
    const value = await tokenIns.totalSupply()
    Trace.debug('Get totalSupply Amount', value)
    return {
      amount: value.toString(),
    }
  }

  /**
   * 添加允许合约操作的金额
   * @param exchangeAddress
   * @param tokenAddress
   * @return 交易hash
   */
  async approve(exchangeAddress: string, tokenAddress: string): Promise<TransactionEvent> {
    const tokenIns = this.connectInfo.create(ERC20Contract, tokenAddress)
    return await tokenIns.approve(exchangeAddress, MAXIMUM_U256)
  }

  /**
   * 根据地址批量获取余额
   * @param user
   * @param tokens
   */
  async batchGetBalance(
    user: string,
    tokens: string[],
  ): Promise<Record<string, { address: string; amount: string; value: string; decimal: number }>> {
    const multiCall = this.connectInfo.create(MultiCallContract)
    const result = await this.connectInfo.multiCall().call(
      ...tokens.map((it) => {
        if (it === ETH_ADDRESS) {
          return {
            address: ETH_ADDRESS,
            balance: multiCall.mulContract.getEthBalance(user),
            decimals: '18',
          }
        }
        const tokenIns = this.connectInfo.create(ERC20Contract, it)
        return {
          address: it,
          balance: tokenIns.mulContract.balanceOf(user),
          decimals: tokenIns.mulContract.decimals(),
        }
      }),
    )

    const data: Record<string, { address: string; amount: string; value: string; decimal: number }> = {}
    result.forEach((it) => {
      data[it.address] = {
        address: it.address,
        amount: new BigNumber(it.balance || '0').div(10 ** Number.parseInt(it.decimals || '0', 10)).toFixed(),
        value: it.balance || '0',
        decimal: Number.parseInt(it.decimals || '0', 10),
      }
    })
    return data
  }

  /**
   * ERC20转账
   * @param tokenAddress
   * @param to
   * @param amount
   * @return 交易hash
   */
  async transfer(tokenAddress: string, to: string, amount: string | number | BigNumber): Promise<TransactionEvent> {
    const tokenIns = this.connectInfo.create(ERC20Contract, tokenAddress)
    const decimal = await tokenIns.decimals()
    const value = new BigNumber(amount).multipliedBy(10 ** decimal).toFixed(0, BigNumber.ROUND_DOWN)
    return await tokenIns.transfer(to, value)
  }

  /**
   * 根据Token对象批量获取余额
   * @param user
   * @param tokens
   */
  async batchGetBalanceInfo(
    user: string,
    tokens: Token[],
  ): Promise<Record<string, Balance>> {
    const multiCall = this.connectInfo.create(MultiCallContract)
    const result = await this.connectInfo.multiCall().call(
      ...tokens.map((it) => {
        if (it.address === ETH_ADDRESS) {
          return {
            address: ETH_ADDRESS,
            balance: multiCall.mulContract.getEthBalance(user),
            decimals: Number(it.decimals).toFixed(),
          }
        }
        const tokenIns = this.connectInfo.create(ERC20Contract, it)
        return {
          address: it.address,
          balance: tokenIns.mulContract.balanceOf(user),
          decimals: Number(it.decimals).toFixed(),
        }
      }),
    )
    const data: Record<string, Balance> = {}
    result.forEach((it, index) => {
      data[it.address] = new Balance(tokens[index], user, new BigNumber(it.balance).div(10 ** it.decimals).toFixed())
    })
    return data
  }

  /**
   * 批量获取余额和授权
   * @param user    用户
   * @param spender 授权的地址
   * @param tokens
   */
  async batchGetBalanceAndAllowance(
    user: string,
    spender: string,
    tokens: Token[],
  ): Promise<Record<string, BalanceAndAllowance>> {
    const multiCall = this.connectInfo.create(MultiCallContract)
    const result = await this.connectInfo.multiCall().call(
      ...tokens.map((it) => {
        if (it.address === ETH_ADDRESS) {
          return {
            address: ETH_ADDRESS,
            balance: multiCall.mulContract.getEthBalance(user),
            allowance: '0',
            decimals: Number(it.decimals).toFixed(),
          }
        }
        const tokenIns = this.connectInfo.create(ERC20Contract, it.address)
        return {
          address: it.address,
          balance: tokenIns.mulContract.balanceOf(user),
          allowance: tokenIns.mulContract.allowance(user, spender),
          decimals: Number(it.decimals).toFixed(),
        }
      }),
    )
    const data: Record<string, BalanceAndAllowance> = {}
    result.forEach((it, index) => {
      data[it.address] = new BalanceAndAllowance(tokens[index], user, new BigNumber(it.balance).div(10 ** it.decimals).toFixed(), new BigNumber(it.allowance).div(10 ** it.decimals).toFixed(), spender)
    })
    return data
  }
}
