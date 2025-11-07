import Identifiable from "@/types/Identifiable";

export namespace MapUtils {
    export function update<K, V extends Identifiable>(map: Map<K, V[]>, key: K, value: V) {
        const current = map.get(key) ?? [];

        let valueUpdated = false;
        current.map((v) => {
            if (v.id === value.id) {
                valueUpdated = true;
                return value;
            }
            return v;
        });

        if (!valueUpdated) {
            current.push(value);
        }

        map.set(key, current);
    }
}