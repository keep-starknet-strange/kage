import { BigNumberish } from "starknet";
import { bytesToHex } from "@noble/hashes/utils";
import { base58 } from "@scure/base";
import { ProjectivePoint } from "@fatsolutions/she";

/////// WARNING:
////// Code copied from @fatsolutions/tongo-sdk/dist/types since using those directly caused problems with metro bundler

export interface PubKey {
    x: BigNumberish;
    y: BigNumberish;
}

export function pubKeyBase58ToAffine(b58string: string): ProjectivePoint {
    const bytes = base58.decode(b58string);
    return ProjectivePoint.fromHex(bytesToHex(bytes));
}

export function projectivePointToStarkPoint(p: ProjectivePoint): PubKey {
    const pAffine = p.toAffine();
    return { x: pAffine.x, y: pAffine.y };
}

export function starkPointToProjectivePoint({ x, y }: PubKey): ProjectivePoint {
    return new ProjectivePoint(BigInt(x), BigInt(y), 1n);
}

export function pubKeyAffineToBase58(pub: PubKey): string {
    const point = starkPointToProjectivePoint(pub);
    return base58.encode(point.toRawBytes(true));
}