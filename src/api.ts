import axios from 'axios';

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
    const response = await axios.get<QuranResponse<Surah[]>>(`${BASE_URL}/surah`);
    return response.data.data;
}

export async function getSurahDetail(number: number, edition: string = 'quran-uthmani'): Promise<Ayah[]> {
    const response = await axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/surah/${number}/${edition}`);
    return response.data.data.ayahs;
}

export async function getSurahWithTranslation(number: number): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const [arabic, translation] = await Promise.all([
        getSurahDetail(number, 'quran-uthmani'),
        getSurahDetail(number, 'id.indonesian')
    ]);
    return { arabic, translation };
}

export async function getJuz(number: number, edition: string = 'quran-uthmani'): Promise<Ayah[]> {
    const response = await axios.get<QuranResponse<{ ayahs: Ayah[] }>>(`${BASE_URL}/juz/${number}/${edition}`);
    return response.data.data.ayahs;
}

export async function getJuzWithTranslation(number: number): Promise<{ arabic: Ayah[], translation: Ayah[] }> {
    const [arabic, translation] = await Promise.all([
        getJuz(number, 'quran-uthmani'),
        getJuz(number, 'id.indonesian')
    ]);
    return { arabic, translation };
}

export async function search(keyword: string): Promise<Ayah[]> {
    const response = await axios.get<QuranResponse<{ count: number, matches: Ayah[] }>>(`${BASE_URL}/search/${keyword}/all/id.indonesian`);
    return response.data.data.matches;
}
