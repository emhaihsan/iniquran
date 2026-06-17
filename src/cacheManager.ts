import * as fs from 'fs';
import * as path from 'path';

export class CacheManager {
    private static storagePath: string;

    public static init(path: string) {
        this.storagePath = path;
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }

    private static getFilePath(key: string): string {
        return path.join(this.storagePath, `${key.replace(/\//g, '_')}.json`);
    }

    public static get<T>(key: string): T | null {
        const filePath = this.getFilePath(key);
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data) as T;
            } catch (error) {
                console.error(`Error reading cache for ${key}:`, error);
                return null;
            }
        }
        return null;
    }

    public static set(key: string, data: any): void {
        const filePath = this.getFilePath(key);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
        } catch (error) {
            console.error(`Error writing cache for ${key}:`, error);
        }
    }
}
