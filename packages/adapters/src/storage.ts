export type PrivateObjectInput = {
  readonly storageKey: string;
  readonly contentType: string;
  readonly bytes: Uint8Array;
};

export interface StorageProvider {
  putPrivateObject(input: PrivateObjectInput): Promise<string>;
  createSignedUrl(storageKey: string, expiresInSeconds: number): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
}
