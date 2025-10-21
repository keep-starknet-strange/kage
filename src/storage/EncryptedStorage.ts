export type AuthPrompt = {
    /** The title for the authentication prompt. */
    title?: string;
    /** The subtitle for the authentication prompt.
     * @platform Android
     */
    subtitleAndroid?: string;
    /** The description for the authentication prompt.
     * @platform Android
     */
    descriptionAndroid?: string;
    /** The cancel button text for the authentication prompt.
     * @platform Android
     */
    cancelAndroid?: string;
}

interface EncryptedStorage {

    getItem(
        key: string,
        auth?: AuthPrompt
    ): Promise<string | null>


    setItem(
        key: string, 
        value: string, 
        auth?: AuthPrompt
    ): Promise<boolean>

    
    removeItem(key: string): Promise<void>;

    // Not sure if possible
    // clear(): Promise<void>;
}

export default EncryptedStorage;