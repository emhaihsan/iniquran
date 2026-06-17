import axios from 'axios';
import { CacheManager } from './cacheManager';
import { JUZ_META } from './quranMeta';

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

export async function getSurahDetail(number: number, edition: string = 'en.sahih'): Promise<Ayah[]> {
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

export async function getPageWithTranslation(pageNumber: number, edition: string = 'en.sahih'): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const cacheKey = `page_${pageNumber}_${edition}`;
    const cached = CacheManager.get<{ arabic: Ayah[], translation: Ayah[] }>(cacheKey);
    if (cached) return cached;

    const [arabicRes, transRes] = await Promise.all([
        axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/page/${pageNumber}/quran-uthmani`),
        axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/page/${pageNumber}/${edition}`)
    ]);

    const result = {
        arabic: arabicRes.data.data.ayahs,
        translation: transRes.data.data.ayahs
    };

    // Optimization: Background download of the full surahs involved on this page
    const surahNumbers = Array.from(new Set(result.arabic.map(a => a.surah?.number))).filter((n): n is number => n !== undefined);
    surahNumbers.forEach(n => getSurahWithTranslation(n, edition)); // Trigger background cache

    CacheManager.set(cacheKey, result);
    return result;
}

export async function search(keyword: string, edition: string = 'en.sahih'): Promise<Ayah[]> {
    const response = await axios.get<QuranResponse<{ count: number, matches: Ayah[] }>>(`${BASE_URL}/search/${keyword}/all/${edition}`);
    return response.data.data.matches;
}
