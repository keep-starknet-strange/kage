import {
  consoleTransport,
  logger,
} from "react-native-logs";

var LOG = logger.createLogger({
  transport: consoleTransport,
  severity: "debug",
  dateFormat: "time",
  printLevel: true,
  printDate: true,
  transportOptions: {
    colors: {
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    },
  },
  enabled: __DEV__,
});

export { LOG };
