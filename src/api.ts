import axios from 'axios';
import { CacheManager } from './cacheManager';

const BASE_URL = 'https://api.alquran.cloud/v1';

export interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

export interface Ayah {
    number: number;
    text: string;
    surah?: Surah;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
}

export interface QuranResponse<T> {
    code: number;
    status: string;
    data: T;
}

export async function getSurahs(): Promise<Surah[]> {
    const cacheKey = 'surahs_list';
    const cached = CacheManager.get<Surah[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get<QuranResponse<Surah[]>>(`${BASE_URL}/surah`);
    const data = response.data.data;
    CacheManager.set(cacheKey, data);
    return data;
}

export async function getSurahDetail(number: number, edition: string = 'quran-uthmani'): Promise<Ayah[]> {
    const cacheKey = `surah_${number}_${edition}`;
    const cached = CacheManager.get<Ayah[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/surah/${number}/${edition}`);
    const data = response.data.data.ayahs;
    CacheManager.set(cacheKey, data);
    return data;
}

export async function getSurahWithTranslation(number: number, edition: string = 'en.sahih'): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const [arabic, translation] = await Promise.all([
        getSurahDetail(number, 'quran-uthmani'),
        getSurahDetail(number, edition)
    ]);
    return { arabic, translation };
}

export async function getJuz(number: number, edition: string = 'quran-uthmani'): Promise<Ayah[]> {
    const cacheKey = `juz_${number}_${edition}`;
    const cached = CacheManager.get<Ayah[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/juz/${number}/${edition}`);
    const data = response.data.data.ayahs;
    CacheManager.set(cacheKey, data);
    return data;
}

export async function getJuzWithTranslation(number: number, edition: string = 'en.sahih'): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const [arabic, translation] = await Promise.all([
        getJuz(number, 'quran-uthmani'),
        getJuz(number, edition)
    ]);
    return { arabic, translation };
}

export async function getPage(number: number, edition: string = 'quran-uthmani'): Promise<Ayah[]> {
    const cacheKey = `page_${number}_${edition}`;
    const cached = CacheManager.get<Ayah[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/page/${number}/${edition}`);
    const data = response.data.data.ayahs;
    CacheManager.set(cacheKey, data);
    return data;
}

export async function getPageWithTranslation(number: number, edition: string = 'en.sahih'): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const [arabic, translation] = await Promise.all([
        getPage(number, 'quran-uthmani'),
        getPage(number, edition)
    ]);
    return { arabic, translation };
}

export async function search(keyword: string, edition: string = 'en.sahih'): Promise<Ayah[]> {
    // Search is dynamic, so we don't cache it for now
    const response = await axios.get<QuranResponse<{ count: number, matches: Ayah[] }>>(`${BASE_URL}/search/${keyword}/all/${edition}`);
    return response.data.data.matches;
}
