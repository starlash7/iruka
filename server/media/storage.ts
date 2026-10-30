/** Private immutable bytes. Authorization and HTTP exposure belong to the media service. */
export interface ImageStorage {
 put(key:string,bytes:Uint8Array):Promise<void>;
 get(key:string):Promise<Uint8Array|null>;
}
