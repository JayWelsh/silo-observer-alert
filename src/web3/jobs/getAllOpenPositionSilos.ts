import { Contract as MulticallContract } from 'ethers-multicall';

import { Contract, utils } from 'ethers';

import BigNumber from 'bignumber.js';

import {
  SILO_LENS_ADDRESS,
  SILO_LENS_ADDRESS_LLAMA,
  SILO_LENS_ADDRESS_ARBITRUM,
} from "../../constants";

import {
  multicallProviderRetryOnFailure,
} from '../utils';

import SiloFactoryABI from '../abis/SiloFactoryABI.json';
import SiloABI from '../abis/SiloABI.json';
import ERC20ABI from '../abis/ERC20ABI.json';
import SiloLensABI from '../abis/SiloLensABI.json';
import SiloLensLlamaABI from '../abis/SiloLensLlamaABI.json';

import {
  IDeployment,
} from '../../interfaces';

BigNumber.config({ EXPONENTIAL_AT: [-1e+9, 1e+9] });

interface IAllSiloAssetRateResults {
  [key: string]: IAllSiloAssetRates[]
}

interface IAllSiloAssetRates {
  rate: string
  side: string
  tokenAddress: string
}

export const getAllOpenPositionSilos = async (watchlistAddress: string, siloAddresses: string [], deploymentConfig: IDeployment) => {

  const siloContracts = siloAddresses.map(siloAddress => {
    let contract = new MulticallContract(deploymentConfig.siloLens, deploymentConfig.siloLensABI);
    return contract;
  }).filter((item) => item);

  const [...allSilosHasOpenPosition] = await multicallProviderRetryOnFailure(siloContracts.map((contract, index) => contract.hasPosition(siloAddresses[index], watchlistAddress)), 'all silo has open position', deploymentConfig.network);

  let siloAddressesWithOpenPositions = [];
  for(let [index, hasOpenPosition] of allSilosHasOpenPosition.entries()) {
    if(hasOpenPosition) {
      siloAddressesWithOpenPositions.push(siloAddresses[index]);
    }
  }

  return siloAddressesWithOpenPositions;

}