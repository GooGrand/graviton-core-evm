import { ethers, waffle } from "hardhat"

import { Contract, Wallet, providers } from 'ethers'
const { Web3Provider } = providers

import { expandTo18Decimals } from './utilities'

import {ERC20} from '../../typechain/ERC20'
import {UniswapV2Factory} from '../../typechain/UniswapV2Factory'
import {UniswapV2Pair__factory as pairFactory} from '../../typechain/factories/UniswapV2Pair__factory'
interface FactoryFixture {
  factory: Contract
}

const overrides = {
  gasLimit: 9999999
}

export async function factoryFixture([wallet]: Wallet[], _: any ): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory("UniswapV2Factory")
  const factory = (await factoryFactory.deploy(
    wallet.address
  )) as UniswapV2Factory
  return { factory }
}

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

export async function pairFixture([wallet]: Wallet[], provider: any): Promise<PairFixture> {
  const { factory } = await factoryFixture([wallet], provider)
  
  const tokenFactory = await ethers.getContractFactory("ERC20")
  const tokenA = (await tokenFactory.deploy(
    expandTo18Decimals(10000)
  )) as ERC20
  const tokenB = (await tokenFactory.deploy(
    expandTo18Decimals(10000)
  )) as ERC20

  await factory.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)

  const pair = new Contract(pairAddress, JSON.stringify(pairFactory.abi), provider).connect(wallet)

  const token0Address = (await pair.token0()).address
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  return { factory, token0, token1, pair }
}
