import {
  consoleTransport,
  logger,
} from "react-native-logs";
import * as ExpoDevice from 'expo-device';
import { logger as starknetLogger } from 'starknet';
starknetLogger.setLogLevel(__DEV__ ? "ERROR" : "OFF");

const deviceName = ExpoDevice.deviceName ?? "Unknown Device";

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
}).extend(`📱 ${deviceName}`);

export { LOG };
