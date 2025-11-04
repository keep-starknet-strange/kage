import EncryptedStorage, { AuthPrompt } from "./EncryptedStorage";

// Currently not encrypting
export default class WebEncryptedStorage implements EncryptedStorage {


    constructor(
        private readonly applicationId: string,
    ) {}

    async getItem(
        key: string, 
        auth?: AuthPrompt
    ): Promise<string | null> {
        const value = localStorage.getItem(this.getService(key));

        if (!value) {
            console.error(`Failed to get item ${key} from web encrypted storage`);
            return null;
        }

        return value;
    }

    async setItem(
        key: string, 
        value: string, 
        auth?: AuthPrompt
    ): Promise<boolean> {
        localStorage.setItem(this.getService(key), value);

        return true;
    }

    async removeItem(key: string): Promise<void> {
        localStorage.removeItem(this.getService(key));
    }

    private getService(key: string): string {
        return `${this.applicationId}.${key}`;
    }
}