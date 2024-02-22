import { IAlertConfig } from './src/interfaces';

export const alertConfig : IAlertConfig = {
  ENABLED_MODES: ["BORROWER", "LENDER"],
  ADDRESS_WATCHLIST: [],
  RATE_IMPACT_CLASSIFICATIONS: {
    CRITICAL: 200,
    SEVERE: 150,
    VERY_HIGH: 100,
    HIGH: 80,
    ELEVATED: 35,
    MEDIUM: 20,
    NORMAL: 10,
    LOW: 1,
  },
  MINIMUM_RATE_IMPACT_ALERT_REQUIREMENT: "MEDIUM",
  TIMEZONE_UTC_OFFSET: 2,
  MORNING_REPORT_TIME: "10:30:00",
  ALERT_FREQUENCY_BY_RATE: {
    CRITICAL: 1,
    SEVERE: 5,
    VERY_HIGH: 10,
    HIGH: 30,
    ELEVATED: 60,
    MEDIUM: 60 * 12,
    NORMAL: 60 * 24,
    LOW: 60 * 24,
  },
  ADDITIONAL_PING_TIMES: [],
  SKIP_GOOD_MORNING_PING: false,
  SKIP_STARTUP_PING: false,
  STARTUP_CHECKPOINT: Math.floor(new Date().setSeconds(0) / 1000) + 60, // set starting point to the next minute so that the first run gives reports
}

// export const alertConfig : IAlertConfig = {
//   ENABLED_MODES: ["BORROWER"],
//   ADDRESS_WATCHLIST: [],
//   RATE_CLASSIFICATIONS: {
//     CRITICAL: 150,
//     VERY_HIGH: 100,
//     HIGH: 80,
//     ELEVATED: 50,
//     MEDIUM: 20,
//     NORMAL: 10,
//     LOW: 1,
//   },
//   MINIMUM_RATE_IMPACT_ALERT_REQUIREMENT: "MEDIUM",
//   MORNING_REPORT_TIME: "09:00:00+02:00",
//   ALERT_FREQUENCY_BY_RATE: {
//     // 1 = every minute
//     // 5 = every 5th minute
//     // 10 = every 3rd minute
//     // ...
//     // 60 = every hour
//     // 60 * 2 = every 2nd hour
//     CRITICAL: 1,
//     VERY_HIGH: 10,
//     HIGH: 30,
//     ELEVATED: 60,
//     MEDIUM: 60 * 6,
//   },
//   ADDITIONAL_PING_TIMES: [],
//   SKIP_GOOD_MORNING_PING: false,
//   SKIP_STARTUP_PING: false,
// }