import { LOG } from '@/utils/logs'

const DB_NAME = 'kage-crypto-keys'
const DB_VERSION = 1
const STORE_NAME = 'keys'
const MASTER_KEY_ID = 'master'

const IV_LENGTH = 12
const TAG_LENGTH = 128

/**
 * Manages a non-extractable AES-256-GCM CryptoKey stored in IndexedDB.
 * 
 * The key is generated once and stored in IndexedDB. Because it's marked
 * as non-extractable, the raw key bytes are never exposed to JavaScript.
 */
export class WebCryptoKeyManager {
  private db: IDBDatabase | null = null
  private masterKey: CryptoKey | null = null

  constructor(private readonly applicationId: string) {}

  async initialize(): Promise<boolean> {
    try {
      this.db = await this.openDatabase()
      this.masterKey = await this.loadOrCreateKey()
      return this.masterKey !== null
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Failed to initialize', error)
      return false
    }
  }

  async encrypt(plaintext: Uint8Array): Promise<Uint8Array | null> {
    if (!this.masterKey) {
      LOG.error('WebCryptoKeyManager: Not initialized')
      return null
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
        this.masterKey,
        plaintext as BufferSource
      )

      const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength)
      result.set(iv, 0)
      result.set(new Uint8Array(ciphertext), IV_LENGTH)

      return result
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Encryption failed', error)
      return null
    }
  }

  async decrypt(encrypted: Uint8Array): Promise<Uint8Array | null> {
    if (!this.masterKey) {
      LOG.error('WebCryptoKeyManager: Not initialized')
      return null
    }

    try {
      const iv = encrypted.slice(0, IV_LENGTH)
      const ciphertext = encrypted.slice(IV_LENGTH)

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: TAG_LENGTH },
        this.masterKey,
        ciphertext
      )

      return new Uint8Array(plaintext)
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Decryption failed', error)
      return null
    }
  }

  async hashKey(key: string): Promise<string> {
    try {
      const keyWithAppId = `${this.applicationId}:${key}`
      const keyBytes = new TextEncoder().encode(keyWithAppId)
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes)
      return this.bytesToBase64(new Uint8Array(hashBuffer))
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Key hashing failed', error)
      throw error
    }
  }

  isInitialized(): boolean {
    return this.masterKey !== null
  }

  async deleteKey(): Promise<void> {
    if (!this.db) return

    try {
      const keyId = `${this.applicationId}_${MASTER_KEY_ID}`
      const transaction = this.db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      await this.promisifyRequest(store.delete(keyId))
      this.masterKey = null
      LOG.debug('WebCryptoKeyManager: Key deleted')
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Failed to delete key', error)
    }
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  private async loadOrCreateKey(): Promise<CryptoKey | null> {
    const existingKey = await this.loadKey()
    if (existingKey) {
      LOG.debug('WebCryptoKeyManager: Loaded existing key')
      return existingKey
    }

    const newKey = await this.generateKey()
    if (newKey) {
      await this.saveKey(newKey)
      LOG.debug('WebCryptoKeyManager: Generated new key')
    }
    return newKey
  }

  private async loadKey(): Promise<CryptoKey | null> {
    if (!this.db) return null

    try {
      const keyId = `${this.applicationId}_${MASTER_KEY_ID}`
      const transaction = this.db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const key = await this.promisifyRequest(store.get(keyId))
      return key || null
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Failed to load key', error)
      return null
    }
  }

  private async saveKey(key: CryptoKey): Promise<void> {
    if (!this.db) return

    try {
      const keyId = `${this.applicationId}_${MASTER_KEY_ID}`
      const transaction = this.db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      await this.promisifyRequest(store.put(key, keyId))
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Failed to save key', error)
    }
  }

  private async generateKey(): Promise<CryptoKey | null> {
    try {
      return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
    } catch (error) {
      LOG.error('WebCryptoKeyManager: Failed to generate key', error)
      return null
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
  }
}
