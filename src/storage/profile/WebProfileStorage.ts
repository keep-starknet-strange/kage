import ProfileStorage from "./ProfileStorage";

export default class WebProfileStorage extends ProfileStorage {
    private readonly profileKey = "profile";

    protected async saveJson(json: string): Promise<void> {
        localStorage.setItem(this.profileKey, json);
    }
    protected async readJson(): Promise<string | null> {
        return localStorage.getItem(this.profileKey);
    }
    protected async deleteJson(): Promise<void> {
        localStorage.removeItem(this.profileKey);
    }
}

