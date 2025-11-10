import Identifiable from "@/types/Identifiable";

export namespace MapUtils {
    export function update<K, V extends Identifiable>(map: Map<K, V[]>, key: K, value: V) {
        const current = map.get(key) ?? [];

        let valueUpdated = false;
        for (const [i, v] of current.entries()) {
            if (v.id === value.id) {
                valueUpdated = true;
                current[i] = value;
                break;
            }
        }

        if (!valueUpdated) {
            current.push(value);
        }

        map.set(key, current);
    }
}