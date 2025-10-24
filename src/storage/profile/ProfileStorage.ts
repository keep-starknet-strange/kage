import { Profile } from '@/profile/profile';
import { File, Directory, Paths } from 'expo-file-system';

export default class ProfileStorage {
    private readonly profileFile: File = new File(Paths.bundle, "profile.json");

    async storeProfile(profile: Profile): Promise<void> {
        const profileString = JSON.stringify(profile);

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
        if (rawProfileJson === null || rawProfileJson.trim().length === 0) {
            return null;
        }
        // TODO add possible validation with zod

        const type = typeof Profile;
        const profile = JSON.parse(rawProfileJson) as Profile;
        return profile;
    }

    async deleteProfile(): Promise<void> {
        this.profileFile.delete();
    }
}