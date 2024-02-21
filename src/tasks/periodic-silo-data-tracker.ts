import { gql } from 'graphql-request';
import axios from 'axios';
import { raw } from 'objection';
import { utils } from "ethers";
import BigNumber from 'bignumber.js';
import { Client, EmbedBuilder } from 'discord.js';

import {
  sleep,
  findRateClassification,
  isItSpecificTimeInUsersLocalTimezone,
} from '../utils';

BigNumber.config({ EXPONENTIAL_AT: [-1e+9, 1e+9] });

import { formatPercentage } from '../utils';

import {
  IRateEntrySubgraph,
  IToken,
  IMarket,
} from '../interfaces';

import {
  getLatestBlockNumber,
} from '../web3/jobs';

import {
  MAX_MINUTELY_RATE_ENTRIES,
  MAX_MINUTELY_TVL_AND_BORROWED_ENTRIES,
  NETWORK_ID_TO_COINGECKO_ID,
  NETWORKS,
  DEPLOYMENT_CONFIGS,
  NETWORK_TO_SUBGRAPH,
  SILO_BLACKLIST,
  COINGECKO_API_KEY,
  ACCOUNT_WATCHLIST,
  DISCORD_USER_ID_LIST,
  ALERT_CONFIG,
} from '../constants'

import {
  getAllSiloAssets,
  getAllSiloAddresses,
  getAllSiloAssetRates,
  getAllOpenPositionSilos,
} from '../web3/jobs';

import e from 'express';
import { alertConfig } from '../../alertConfig';

const siloQuery =  `{
  markets {
    id
    inputToken {
      id
      symbol
      lastPriceUSD
    }
    outputToken {
      id
      lastPriceUSD
    }
    rates {
      rate
      side
      type
      token {
        id
        symbol
        decimals
      }
    }
  }
  _meta {
    block {
      hash
      timestamp
    }
  }
}`;

const siloQueryTempArbitrumForceHeadIndexers = (latestBlockNumber: number) => `{
  markets(block: {number_gte: ${latestBlockNumber}}) {
    id
    inputToken {
      id
      symbol
      lastPriceUSD
    }
    outputToken {
      id
      lastPriceUSD
    }
    rates {
      rate
      side
      type
      token {
        id
        symbol
        decimals
      }
    }
  }
  _meta {
    block {
      hash
      timestamp
    }
  }
}`;

let enableRateSync = true;

interface ITokenAddressToLastPrice {
  [key: string]: string
}

interface ICoingeckoAssetPriceEntryResponse {
  [key: string]: ICoingeckoAssetPriceEntry
}

interface ICoingeckoAssetPriceEntry {
  usd: number 
}

let coingeckoRetryMax = 10;

// TODO move to dedicated file to share with other files which might use it in the future
const fetchCoingeckoPrices = async (assetAddressesQueryString : string, network: string, retryCount = 0) => {
  let results : ICoingeckoAssetPriceEntry[] = await axios.get(
    `https://pro-api.coingecko.com/api/v3/simple/token_price/${NETWORK_ID_TO_COINGECKO_ID[network]}?contract_addresses=${assetAddressesQueryString}&vs_currencies=USD&x_cg_pro_api_key=${COINGECKO_API_KEY}`,
    {
      headers: { "Accept-Encoding": "gzip,deflate,compress" }
    }
  )
  .then(function (response) {
    // handle success
    return response?.data ? response?.data : {};
  })
  .catch(async (e) => {
    retryCount++;
    if(retryCount < coingeckoRetryMax) {
      console.error(`error fetching coingecko prices at ${Math.floor(new Date().getTime() / 1000)}, retry #${retryCount}...`, e);
      await sleep(5000);
      return await fetchCoingeckoPrices(assetAddressesQueryString, network, retryCount);
    } else {
      console.error(`retries failed, error fetching coingecko prices at ${Math.floor(new Date().getTime() / 1000)}`, e);
    }
    return {};
  })
  let assetAddressToCoingeckoUsdPrice : ITokenAddressToLastPrice = {}
  let iterable = Object.entries(results);
  if(iterable.length > 0) {
    for(let assetAddressToPrice of iterable) {
      let checksumAssetAddress = utils.getAddress(assetAddressToPrice[0]);
      if(assetAddressToPrice[1].usd) {
        assetAddressToCoingeckoUsdPrice[checksumAssetAddress] = new BigNumber(assetAddressToPrice[1].usd).toString();
      } else {
        assetAddressToCoingeckoUsdPrice[checksumAssetAddress] = new BigNumber(0).toString();
      }
    }
  }
  return assetAddressToCoingeckoUsdPrice;
}

const periodicSiloDataTracker = async (useTimestampUnix: number, startTime: number, discordClient: Client | undefined) => {

  let useTimestampPostgres = new Date(useTimestampUnix * 1000).toISOString();
  let isMorningReport = isItSpecificTimeInUsersLocalTimezone(useTimestampUnix, alertConfig.TIMEZONE_UTC_OFFSET, alertConfig.MORNING_REPORT_TIME);
  
  if(isMorningReport && discordClient) {
    for(let discordUserID of DISCORD_USER_ID_LIST) {
      discordClient.users.fetch(discordUserID).then((user: any) => {
        user.send(`Morning Report! | ${new Date(useTimestampUnix * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
      });
    }
  }

  console.log({isMorningReport});

  for(let deploymentConfig of DEPLOYMENT_CONFIGS) {

    try {

      let siloAddressesFromChain = await getAllSiloAddresses(deploymentConfig);

      let allSiloAddressesWithOpenPositions : string[] = [];
      for(let watchlistAddress of ACCOUNT_WATCHLIST) {
        let siloAddressesWithOpenPositions = await getAllOpenPositionSilos(watchlistAddress, siloAddressesFromChain, deploymentConfig);
        allSiloAddressesWithOpenPositions = [...allSiloAddressesWithOpenPositions, ...siloAddressesWithOpenPositions];
      }

      let {
        success,
        siloAddresses,
        allSiloAssetsWithState,
        assetAddresses,
        siloAddressToSiloAssets,
        siloAssetAddressToSymbol,
      } = await getAllSiloAssets(deploymentConfig, allSiloAddressesWithOpenPositions);

      if(success && (allSiloAddressesWithOpenPositions?.length > 0)) {

        console.log({'allSiloAddressesWithOpenPositions.length': allSiloAddressesWithOpenPositions.length, 'siloAddresses.length': siloAddresses.length, allSiloAddressesWithOpenPositions, siloAddresses})

        let siloAssetRates = await getAllSiloAssetRates(siloAddresses, allSiloAddressesWithOpenPositions, siloAddressToSiloAssets, allSiloAssetsWithState, deploymentConfig);

        console.log({
          siloAssetRates,
        })

        
        let entryCount = 0;
        let duplicatePrevention : {[key: string]: {[key: string]: {[key: string]: boolean}}} = {};
        for(let [key, value] of Object.entries(siloAssetRates)) {
          console.log({key, value});
          let buildRateResult = [];
          let siloChecksumAddress = utils.getAddress(key);
          for(let rateRecord of value) {
            let embeds :any[] = [];
            let {
              tokenAddress,
              rate,
              side,
            } = rateRecord;
            let tokenSymbol = siloAssetAddressToSymbol[tokenAddress];
            console.log({tokenAddress, rate, side})
            if(Number(rate) > ALERT_CONFIG.RATE_IMPACT_CLASSIFICATIONS[ALERT_CONFIG.MINIMUM_RATE_IMPACT_ALERT_REQUIREMENT]) {
              let rateClassification = findRateClassification(ALERT_CONFIG.RATE_IMPACT_CLASSIFICATIONS, Number(rate));
              let alertFrequency = 0;
              let triggerAlert = false;
              if(rateClassification && ALERT_CONFIG.ALERT_FREQUENCY_BY_RATE[rateClassification]) {
                alertFrequency = ALERT_CONFIG.ALERT_FREQUENCY_BY_RATE[rateClassification];
                let secondsSinceStartupCheckpoint = new BigNumber(useTimestampUnix).minus(ALERT_CONFIG.STARTUP_CHECKPOINT).toNumber();
                let minutesSinceStartupCheckpoint = new BigNumber(secondsSinceStartupCheckpoint).dividedBy(60).toNumber();
                triggerAlert = ((minutesSinceStartupCheckpoint % alertFrequency) === 0) || isMorningReport;
              }
              let isDuplicate = false;
              if(duplicatePrevention?.[siloChecksumAddress]?.[tokenAddress]?.[side]) {
                isDuplicate = true;
              }
              if(triggerAlert && !isDuplicate) {
                if(!duplicatePrevention[siloChecksumAddress]) {
                  duplicatePrevention[siloChecksumAddress] = {};
                }
                if(!duplicatePrevention[siloChecksumAddress][tokenAddress]) {
                  duplicatePrevention[siloChecksumAddress][tokenAddress] = {};
                }
                if(!duplicatePrevention[siloChecksumAddress][tokenAddress][side]) {
                  duplicatePrevention[siloChecksumAddress][tokenAddress][side] = true;
                }
                let embed = await new EmbedBuilder()
                  .setAuthor({ name: `\u200B`, iconURL: tokenSymbol ? `https://app.silo.finance/images/logos/${tokenSymbol}.png` : 'https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/silo-circle.png' })
                  .addFields(
                    [
                      { name: `${tokenSymbol} ${side} Rate:`, value: `*${formatPercentage(rate)} APR*` }
                    ]
                  )
                  .setTitle(`${rateClassification.replace("_", " ")} rates on ${tokenSymbol} (${side})`)
                  .setURL(`https://app.silo.finance/silo/${siloChecksumAddress}`)
                  .setFooter({ text: `alert.silo.observer`, iconURL: 'https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/silo-observer-tiny.png' })
                embeds.push(embed);
                console.log({embeds})

                if(discordClient) {
                  if(embeds?.length > 0) {
                    for(let discordUserID of DISCORD_USER_ID_LIST) {
                      discordClient.users.fetch(discordUserID).then((user: any) => {
                        user.send({embeds: embeds});
                      });
                    }
                  }
                }
              }
            }
          }
          
        }

        let coingeckoAddressesQuery = assetAddresses.join(',');

        // let tokenAddressToCoingeckoPrice = await fetchCoingeckoPrices(coingeckoAddressesQuery, deploymentConfig.network);

        let latestBlockNumber = await getLatestBlockNumber(deploymentConfig.network);

        for(let siloAddress of allSiloAddressesWithOpenPositions) {

          let siloChecksumAddress = utils.getAddress(siloAddress);

          // RATE HANDLING BELOW

          // Store rates for each asset
          if(siloAssetRates[siloChecksumAddress]) {
            for (let rateEntry of siloAssetRates[siloChecksumAddress]) {
              let {
                tokenAddress,
                rate,
                side,
              } = rateEntry;

              let rateToNumericPrecision = new BigNumber(rate).precision(16).toString();

              let rateAssetChecksumAddress = utils.getAddress(tokenAddress);

              // All rates show as variable on subgraph at the moment
              // TODO: Figure out actual rate types via chain query
              let type = "VARIABLE";

              if(enableRateSync) {

                // let latestRecord = await RateLatestRepository.getLatestRateByAssetOnSideInSilo(rateAssetChecksumAddress, side, siloChecksumAddress, deploymentConfig.id);
                // if(latestRecord) {
                //   // update latest record
                //   await RateLatestRepository.update({
                //     rate: rateToNumericPrecision,
                //     timestamp: useTimestampPostgres,
                //   }, latestRecord.id);
                // } else {
                //   // create latest record
                //   await RateLatestRepository.create({
                //     silo_address: siloChecksumAddress,
                //     asset_address: rateAssetChecksumAddress,
                //     rate: rateToNumericPrecision,
                //     side: side,
                //     type: type,
                //     timestamp: useTimestampPostgres,
                //     network: deploymentConfig.network,
                //     deployment_id: deploymentConfig.id,
                //   });
                // }

                // await RateRepository.create({
                //   silo_address: siloChecksumAddress,
                //   asset_address: rateAssetChecksumAddress,
                //   rate: rateToNumericPrecision,
                //   side: side,
                //   type: type,
                //   timestamp: useTimestampPostgres,
                //   network: deploymentConfig.network,
                //   deployment_id: deploymentConfig.id,
                // });

                // if(isHourlyMoment) {
                //   await RateHourlyRepository.create({
                //     silo_address: siloChecksumAddress,
                //     asset_address: rateAssetChecksumAddress,
                //     rate: rateToNumericPrecision,
                //     side: side,
                //     type: type,
                //     timestamp: useTimestampPostgres,
                //     network: deploymentConfig.network,
                //     deployment_id: deploymentConfig.id,
                //   });
                // }

              }

            }

          } else {
            console.log({'could not process rates for': siloChecksumAddress})
          }

          // RATE HANDLING ABOVE

          // --------------------------------------------------
        }

        console.log(`Sync success (${deploymentConfig.network} - ${deploymentConfig.id}) (${useTimestampPostgres}), enableRateSync: ${enableRateSync}, exec time: ${new Date().getTime() - startTime}ms`);
    
      }else{
        if(allSiloAddressesWithOpenPositions?.length > 0) {
          throw new Error(`getAllSiloAssetBalances unsuccessful`)
        }
      }
    } catch (error) {
      console.error(`Unable to store latest rates for silos (${deploymentConfig.network} - ${deploymentConfig.id}) (${useTimestampPostgres})`, error);
    }

  }
}

export {
  periodicSiloDataTracker
}