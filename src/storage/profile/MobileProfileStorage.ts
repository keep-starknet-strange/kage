import { File, Paths } from 'expo-file-system';
import ProfileStorage from './ProfileStorage';

export default class MobileProfileStorage extends ProfileStorage {
    private readonly profileFile: File = new File(Paths.cache, "profile.json");

    protected async saveJson(json: string): Promise<void> {
        if (!this.profileFile.exists) {
            this.profileFile.create();
        }

        this.profileFile.write(json);
    }

    protected async readJson(): Promise<string | null> {
        if (!this.profileFile.exists) {
            return null;
        }

        return await this.profileFile.text();
    }

    protected async deleteJson(): Promise<void> {
        this.profileFile.delete();
    }
}