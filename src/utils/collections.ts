/**
 * Groups an array of items by a specified key.
 * 
 * @param array - The array to group
 * @param keySelector - Function that returns the key for each item
 * @returns A Map where keys are the group keys and values are arrays of items
 * 
 * @example
 * const users = [
 *   { name: "Alice", age: 25, city: "NYC" },
 *   { name: "Bob", age: 30, city: "LA" },
 *   { name: "Charlie", age: 25, city: "NYC" }
 * ];
 * 
 * // Group by age
 * const byAge = groupBy(users, user => user.age);
 * // Map { 25 => [Alice, Charlie], 30 => [Bob] }
 * 
 * // Group by city
 * const byCity = groupBy(users, user => user.city);
 * // Map { "NYC" => [Alice, Charlie], "LA" => [Bob] }
 */
export function groupBy<T, K>(
    array: T[],
    keySelector: (item: T) => K
): Map<K, T[]> {
    const map = new Map<K, T[]>();

    for (const item of array) {
        const key = keySelector(item);
        const group = map.get(key);

        if (group) {
            group.push(item);
        } else {
            map.set(key, [item]);
        }
    }

    return map;
}

