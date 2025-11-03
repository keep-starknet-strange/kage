import Profile from '@/profile/profile';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { File, Paths } from 'expo-file-system';

export default class ProfileStorage {
    private readonly profileFile: File = new File(Paths.cache, "profile.json");

    async storeProfile(profile: Profile): Promise<void> {
        const profilePlain = instanceToPlain(profile);
        const profileString = JSON.stringify(profilePlain);

        if (!this.profileFile.exists) {
            this.profileFile.create();
        }

        this.profileFile.write(profileString);
    }

    async readProfile(): Promise<Profile | null> {
        if (!this.profileFile.exists) {
            return null;
        }

        const rawProfileJson = await this.profileFile.text();
        const profilePlain: Object = JSON.parse(rawProfileJson);
        return plainToInstance(Profile, profilePlain);
    }

    async deleteProfile(): Promise<void> {
        this.profileFile.delete();
    }
}