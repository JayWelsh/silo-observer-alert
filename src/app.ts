import express from "express";
import { Provider } from 'ethers-multicall';
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { Model } from "objection";
import Knex from "knex";
import {CronJob} from "cron";
import {providers} from "ethers";
import {
	NETWORK_TO_ALCHEMY_ENDPOINT,
  DISCORD_USER_ID_LIST,
  ALERT_CONFIG,
  ACCOUNT_WATCHLIST,
} from "./constants"

import routes from "./routes";

import {
  getUserLocalDateTime,
} from './utils'

import registerBotCommands from './tasks/register-bot-commands';
import botLoginAndReadyUp from './tasks/bot-login-and-ready-up';
import { periodicSiloDataTracker } from './tasks/periodic-silo-data-tracker';
import { alertConfig } from "../alertConfig";

// minutely cycle to run indexer, 10 = 10 minutes (i.e. 10, 20, 30, 40, 50, 60 past the hour).
// recommend to use 10 if doing a full sync, once up to speed, 3 minutes should be safe.
// using 6 for Alchemy costs
let cronIndexerPeriodMinutes = 1; // temp until new month

let corsOptions = {
  origin: ['http://localhost:3000', 'https://silo.observer', 'https://www.silo.observer', 'https://alert.silo.observer'],
}

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app);

app.listen(port);

console.log(`----- ⚡ SERVER LISTENING ⚡ -----`);
console.log(`-------- ⚡ PORT: ${port} ⚡ --------`);

console.log({ACCOUNT_WATCHLIST})

registerBotCommands();
let discordClient = botLoginAndReadyUp();

// web3

// ETH MAINNET
export const EthersProvider = new providers.JsonRpcProvider(NETWORK_TO_ALCHEMY_ENDPOINT["ethereum"]);
export const MulticallProvider = new Provider(EthersProvider);
MulticallProvider.init();

// ARBITRUM
export const EthersProviderArbitrum = new providers.JsonRpcProvider(NETWORK_TO_ALCHEMY_ENDPOINT["arbitrum"]);
export const MulticallProviderArbitrum = new Provider(EthersProviderArbitrum, 42161);
MulticallProviderArbitrum.init();

const runSync = new CronJob(
	`0 */${cronIndexerPeriodMinutes} * * * *`,
	async () => {
		let useTimestampUnixSiloDataTracker = Math.floor(new Date().setSeconds(0) / 1000);
    let startTimeSiloDataTracker = new Date().getTime();
		console.log("Running SiloDataTracker", new Date(useTimestampUnixSiloDataTracker * 1000));
    await periodicSiloDataTracker(useTimestampUnixSiloDataTracker, startTimeSiloDataTracker, discordClient);
    // if(discordClient) {
    //   for(let discordUserID of DISCORD_USER_ID_LIST) {
    //     discordClient.users.fetch(discordUserID).then((user: any) => {
    //       user.send(`Running at ${useTimestampUnixSiloDataTracker}`);
    //     });
    //   }
    // }
    console.log(`Finished in ${(new Date().getTime() - startTimeSiloDataTracker) / 1000} seconds`);
	},
	null,
	true,
	'Etc/UTC'
);

runSync.start();

(async () => {
  console.log("Running SiloDataTracker", getUserLocalDateTime(new Date().getTime() / 1000, alertConfig.TIMEZONE_UTC_OFFSET));
  if(!ALERT_CONFIG.SKIP_STARTUP_PING) {
    if(discordClient) {
      for(let discordUserID of DISCORD_USER_ID_LIST) {
        discordClient.users.fetch(discordUserID).then((user: any) => {
          user.send(`Service started! | ${getUserLocalDateTime(new Date().getTime() / 1000, alertConfig.TIMEZONE_UTC_OFFSET).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
        });
      }
    }
  }
})();