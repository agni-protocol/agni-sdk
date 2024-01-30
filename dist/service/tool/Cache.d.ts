export declare class Cache {
    static readonly DEFAULT_TTL: number;
    static readonly ETERNITY_TTL: number;
    ttl: number;
    data: Record<string, any>;
    constructor(ttl: number);
    now(): number;
    nuke(key: string): this;
    get(key: string): any;
    getByCreate(key: string, create: () => [any, number]): any;
    del(key: string): any;
    put(key: string, val?: any, ttl?: number): any;
}
export declare function clearCache(): void;
export declare function getCache(): Cache;
