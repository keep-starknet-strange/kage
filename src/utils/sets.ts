export function symmetricDifference<T>(thisSet: Set<T>, otherSet: Set<T>): Set<T> {
    const result = new Set<T>();
    
    for (const elem of thisSet) {
        if (!otherSet.has(elem)) {
            result.add(elem);
        }
    }
    
    for (const elem of otherSet) {
        if (!thisSet.has(elem)) {
            result.add(elem);
        }
    }
    
    return result;
};