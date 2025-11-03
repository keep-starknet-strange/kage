import { Expose, Type } from 'class-transformer';
import uuid from 'react-native-uuid';
import { Actor } from './actor';
import { Device } from './device';

export enum ProfileVersion {
    V1 = 1
}

export default class Header {
    readonly version: ProfileVersion = ProfileVersion.V1;

    @Expose({ name: 'id' })
    readonly profileId: string;

    @Type(() => Actor)
    readonly createdBy: Actor;

    @Type(() => Actor)
    readonly updatedBy: Actor;

    public static createByCurrentDevice(): Header {
        return Header.create(
            new Device(uuid.v4())
        );
    }

    public static create(createdBy: Device): Header {
        const createdAt = new Date();
        const actor = new Actor(createdAt, createdBy);
        return new Header(
            uuid.v4(),
            actor,
            actor
        );
    }

    constructor(
        profileId: string,
        createdBy: Actor,
        updatedBy: Actor
    ) {
        this.profileId = profileId;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
    }

    updateUsed(at: Date): Header {
        return new Header(
            this.profileId,
            this.createdBy,
            new Actor(at, this.updatedBy.device)
        );
    }

}

