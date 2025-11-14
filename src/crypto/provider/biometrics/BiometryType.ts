import { AppError } from "@/types/appError";
import { BIOMETRY_TYPE } from "react-native-keychain";

export enum BiometryType {
    TOUCH_ID = "TOUCH_ID",
    FACE_ID = "FACE_ID",
    FINGERPRINT = "FINGERPRINT",
    IRIS = "IRIS",
    FACE = "FACE",
    OPTIC_ID = "OPTIC_ID",
}

export namespace BiometryType {
    export function fromKeychain(biometryType: BIOMETRY_TYPE): BiometryType {
        switch (biometryType) {
            case BIOMETRY_TYPE.TOUCH_ID:
                return BiometryType.TOUCH_ID;
            case BIOMETRY_TYPE.FACE_ID:
                return BiometryType.FACE_ID;
            case BIOMETRY_TYPE.FINGERPRINT:
                return BiometryType.FINGERPRINT;
            case BIOMETRY_TYPE.IRIS:
                return BiometryType.IRIS;
            case BIOMETRY_TYPE.FACE:
                return BiometryType.FACE;
            case BIOMETRY_TYPE.OPTIC_ID:
                return BiometryType.OPTIC_ID;
            default:
                throw new AppError("Unsupported biometry type", biometryType);
        }
    }
}