import { Type } from "class-transformer";
import { Device } from "./device";

export class Actor {
    @Type(() => Date)
    readonly actedAt: Date;

    @Type(() => Device)
    readonly device: Device;

    constructor(time: Date, device: Device) {
        this.actedAt = time;
        this.device = device;
    }
}