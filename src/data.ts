import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '..', 'assets', 'data', 'quran-uthmani.json');

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

interface RawAyah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
}

interface RawSurah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: RawAyah[];
}

interface RawQuranData {
    surahs: RawSurah[];
}

let _data: RawQuranData | null = null;

function loadData(): RawQuranData {
    if (!_data) {
        const raw = fs.readFileSync(DATA_PATH, 'utf8');
        _data = JSON.parse(raw) as RawQuranData;
    }
    return _data;
}

function toSurah(raw: RawSurah): Surah {
    return {
        number: raw.number,
        name: raw.name,
        englishName: raw.englishName,
        englishNameTranslation: raw.englishNameTranslation,
        numberOfAyahs: raw.ayahs.length,
        revelationType: raw.revelationType
    };
}

function toAyah(raw: RawAyah, surah: Surah): Ayah {
    return {
        number: raw.number,
        text: raw.text,
        surah: surah,
        numberInSurah: raw.numberInSurah,
        juz: raw.juz,
        manzil: raw.manzil,
        page: raw.page,
        ruku: raw.ruku,
        hizbQuarter: raw.hizbQuarter
    };
}

export function getSurahs(): Surah[] {
    return loadData().surahs.map(toSurah);
}

export function getSurahDetail(number: number): Ayah[] {
    const raw = loadData().surahs.find(s => s.number === number);
    if (!raw) return [];
    const surah = toSurah(raw);
    return raw.ayahs.map(a => toAyah(a, surah));
}

export function getPageAyahs(pageNumber: number): Ayah[] {
    const result: Ayah[] = [];
    for (const rawSurah of loadData().surahs) {
        const surah = toSurah(rawSurah);
        for (const rawAyah of rawSurah.ayahs) {
            if (rawAyah.page === pageNumber) {
                result.push(toAyah(rawAyah, surah));
            }
        }
    }
    return result;
}
