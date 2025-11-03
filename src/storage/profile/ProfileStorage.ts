import Profile from '@/profile/profile';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export default abstract class ProfileStorage {
    async storeProfile(profile: Profile): Promise<void> {
        const profilePlain = instanceToPlain(profile);
        const profileString = JSON.stringify(profilePlain);
        await this.saveJson(profileString);
    }

    async readProfile(): Promise<Profile | null> {
        const rawProfileJson = await this.readJson();
        if (rawProfileJson === null) {
            return null;
        }
        
        const profilePlain: Object = JSON.parse(rawProfileJson);
        return plainToInstance(Profile, profilePlain);
    }

    async deleteProfile(): Promise<void> {
        await this.deleteJson();
    }

    protected abstract saveJson(json: string): Promise<void>;
    protected abstract readJson(): Promise<string | null>;
    protected abstract deleteJson(): Promise<void>;
}

