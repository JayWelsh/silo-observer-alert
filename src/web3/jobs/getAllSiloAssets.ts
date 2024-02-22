import { Contract as MulticallContract } from 'ethers-multicall';

import { Contract, utils } from 'ethers';

import BigNumber from 'bignumber.js';

import {
  EthersProvider,
  EthersProviderArbitrum,
} from "../../app";

import {
  SILO_FACTORY_ADDRESS,
  SILO_CONVEX_FACTORY_ADDRESS,
  SILO_LLAMA_FACTORY_ADDRESS,
  SILO_FACTORY_ADDRESS_ARBITRUM,
  SILO_BLACKLIST,
} from "../../constants";

import SiloFactoryABI from '../abis/SiloFactoryABI.json';
import SiloConvexFactoryABI from '../abis/SiloConvexFactoryABI.json';
import SiloLlamaFactoryABI from '../abis/SiloLlamaFactoryABI.json';
import SiloABI from '../abis/SiloABI.json';
import ERC20ABI from '../abis/ERC20ABI.json';

import {
  queryFilterRetryOnFailure,
  multicallProviderRetryOnFailure,
} from '../utils';

import {
  IDeployment,
} from '../../interfaces';

BigNumber.config({ EXPONENTIAL_AT: [-1e+9, 1e+9] });

interface IAllSiloAssetBalanceResults {
  [key: string]: IAllSiloAssetBalances[]
}

interface IAllSiloAssetBalances {
  balance: string
  decimals: number
  tokenAddress: string
}

export const getAllSiloAssets = async (deploymentConfig: IDeployment, siloAddresses: string[]) => {

  let siloFactories = [];

  for(let siloFactoryConfig of deploymentConfig.siloFactories) {
    if(deploymentConfig.network === 'ethereum') {
      let FactoryContract = new Contract(siloFactoryConfig.address, siloFactoryConfig.abi);
      let factoryContract = await FactoryContract.connect(EthersProvider);
      siloFactories.push({contract: factoryContract, meta: siloFactoryConfig.meta});
    } else if (deploymentConfig.network === 'arbitrum') {
      let FactoryContract = new Contract(siloFactoryConfig.address, siloFactoryConfig.abi);
      let factoryContract = await FactoryContract.connect(EthersProviderArbitrum);
      siloFactories.push({contract: factoryContract, meta: siloFactoryConfig.meta});
    }
  }

  let assetAddresses : string[] = [];
  let allSiloAssetsWithState : any[] = [];
  let siloAssetBalances : IAllSiloAssetBalanceResults = {}
  let siloAddressToSiloAssets : {[key: string]: string[]} = {};
  let siloAssetAddressToSymbol : {[key: string]: string} = {};
  let siloAddressToSiloName : {[key: string]: string} = {};

  let finalResult = {
    success: true,
    siloAssetBalances: siloAssetBalances,
    allSiloAssetsWithState: allSiloAssetsWithState,
    siloAddresses: siloAddresses,
    assetAddresses: assetAddresses,
    siloAddressToSiloAssets: siloAddressToSiloAssets,
    siloAssetAddressToSymbol: siloAssetAddressToSymbol,
    siloAddressToSiloName: siloAddressToSiloName,
  }

  let isTripwire = false;
  for(let siloFactoryContractEntry of siloFactories) {
    if(!isTripwire) {
      isTripwire = true;
      let {
        contract: siloFactoryContract,
        meta,
      } = siloFactoryContractEntry;
      if(siloFactoryContract) {

        const assetAddresses : string[] = [];

        const indexedSiloAddresses : string[] = [];

        const siloContracts = siloAddresses.map(address => {
          indexedSiloAddresses.push(address);
          let contract = new MulticallContract(address, SiloABI);
          return contract;
        });

        const [...allSiloAssetsWithState] = await multicallProviderRetryOnFailure(siloContracts.map(contract => contract.getAssets()), 'all silos with state', deploymentConfig.network);

        console.log({'allSiloAssetsWithState.flat()': allSiloAssetsWithState.flat()})
        let tokenAddresses : string[] = Array.from(new Set(allSiloAssetsWithState.flat()));
        console.log({tokenAddresses})
        let tokenQueryIndex = 0;
        const tokenContracts = tokenAddresses.map(tokenAddress => {
          let contract = new MulticallContract(tokenAddress, ERC20ABI);
          tokenQueryIndex++
          return contract;
        })

        console.log({tokenContracts})

        const [...allSiloAssetSymbols] = await multicallProviderRetryOnFailure(tokenContracts.map((contract, index) => contract.symbol()), 'all silo asset symbols', deploymentConfig.network);

        console.log({allSiloAssetSymbols});
        for(let [index, assetSymbol] of allSiloAssetSymbols.entries()) {
          if(!finalResult.siloAssetAddressToSymbol[tokenAddresses[index]]) {
            finalResult.siloAssetAddressToSymbol[tokenAddresses[index]] = assetSymbol;
          }
        }

        let siloIndex = 0;
        let queryIndexToSiloAddress : string[] = [];
        for(let singleSiloAssetsWithState of allSiloAssetsWithState) {
          let siloAddress = indexedSiloAddresses[siloIndex];
          if(!finalResult.siloAddressToSiloAssets[siloAddress]) {
            finalResult.siloAddressToSiloAssets[siloAddress] = singleSiloAssetsWithState;
          }
          for(let singleSiloAsset of singleSiloAssetsWithState) {
            queryIndexToSiloAddress.push(siloAddress);
            if(assetAddresses.indexOf(singleSiloAsset) === -1) {
              assetAddresses.push(singleSiloAsset);
            }
            if(!siloAddressToSiloName[siloAddress]) {
              siloAddressToSiloName[siloAddress] = finalResult.siloAssetAddressToSymbol[singleSiloAsset];
            } else if(siloAddressToSiloName[siloAddress].indexOf(finalResult.siloAssetAddressToSymbol[singleSiloAsset]) === -1) {
              siloAddressToSiloName[siloAddress] += `-${finalResult.siloAssetAddressToSymbol[singleSiloAsset]}`
            }
          }
          siloIndex++;
        }
        
        if(allSiloAssetsWithState.length === 0 || siloAddresses.length === 0 || assetAddresses.length === 0) {
          finalResult.success = false;
        }
        finalResult.allSiloAssetsWithState = [...finalResult.allSiloAssetsWithState, ...allSiloAssetsWithState];
        finalResult.assetAddresses = [...finalResult.assetAddresses, ...assetAddresses];
        finalResult.siloAddressToSiloName = siloAddressToSiloName;
        

      }
    }
  }

  return finalResult;

}