import Profile from "./profile";

export type ProfileState = "idle" | "retrieving" | Profile | ProfileStateError | null;

export type ProfileStateError = {
    type: "profileStateError";
    error: Error;
}

export namespace ProfileState {

    export function canChangeProfileState(state: ProfileState): boolean {
        return !isProfile(state) && state !== "retrieving";
    }

    export function canCreateProfile(state: ProfileState): boolean {
        return state === null;
    }

    export function isError(state: ProfileState): state is ProfileStateError {
        if (typeof state !== 'object' || state === null) {
            return false
        }

        return "type" in state && state.type === "profileStateError";
    }

    export function isProfile(state: ProfileState): state is Profile {
        if (typeof state !== 'object' || state === null) {
            return false
        }

        return "header" in state && "profileId" in state.header && typeof state.header.profileId === "string";
    }

    export function isOnboarded(state: ProfileState): boolean {
        return isProfile(state) && state.networks.length > 0;
    }
}