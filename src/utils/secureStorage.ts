import Keychain, { ACCESS_CONTROL, ACCESSIBLE } from "react-native-keychain";

// Cross-platform string storage with SecureStore on native and localStorage on web.
export async function getStringItem(key: string): Promise<string | null> {
  const isSecured = await isConsideredSecured()
    if (!isSecured) {
      console.warn("Cannot get due to no passcode set (at least)")
      return null;
    }

  try {
    const cred = await Keychain.getGenericPassword(
      {
        authenticationPrompt: {
          title: "Auth title",
          cancel: "Cancel"
        },
        accessControl: ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        service: key,
      }
    )

    if (cred) {
      console.log("Get str outcome", cred.username, cred.password)
      return cred.password
    } else {

      console.log("Get str outcome", cred)
      return null
    }
  } catch (e) {
    console.warn(e)
    return null
  }
}

export async function setStringItem(key: string, value: string): Promise<boolean> {
  try {
    const isSecured = await isConsideredSecured()
    if (!isSecured) {
      console.warn("Cannot save due to no passcode set (at least)")
      return false;
    };

    const result = await Keychain.setGenericPassword(
      key,
      value,
      {
        authenticationPrompt: {
          title: "Auth title",
          cancel: "Cancel"
        },
        accessible: ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        // Works only when biometrics are set https://github.com/oblador/react-native-keychain/issues/509
        accessControl: ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE, 
        service: key,
      },
    );

    console.log(`Set item ${key} is ${result}`)
    return true;
  } catch (e) {
    console.warn(e)
    return false;
  }
}

export async function removeItem(key: string): Promise<void> {
  const res = await Keychain.resetInternetCredentials({ service: key });
  console.log(`Reset ${res}`)
}

export async function removeAll(): Promise<void> {
  const res = await Keychain.resetGenericPassword();
  console.log(`Reset ${res}`)
}


// At the very least passcode is set
async function isConsideredSecured(): Promise<boolean> {
  return await Keychain.isPasscodeAuthAvailable();
}