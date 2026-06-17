export interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    startPage: number;
}

export interface JuzMeta {
    number: number;
    startSurah: number;
    startAyah: number;
    endSurah: number;
    endAyah: number;
    startPage: number;
    endPage: number;
}

export const JUZ_META: { [key: number]: JuzMeta } = {
    1: { number: 1, startSurah: 1, startAyah: 1, endSurah: 2, endAyah: 141, startPage: 1, endPage: 21 },
    2: { number: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 252, startPage: 22, endPage: 41 },
    3: { number: 3, startSurah: 2, startAyah: 253, endSurah: 3, endAyah: 92, startPage: 42, endPage: 61 },
    4: { number: 4, startSurah: 3, startAyah: 93, endSurah: 4, endAyah: 23, startPage: 62, endPage: 81 },
    5: { number: 5, startSurah: 4, startAyah: 24, endSurah: 4, endAyah: 147, startPage: 82, endPage: 101 },
    6: { number: 6, startSurah: 4, startAyah: 148, endSurah: 5, endAyah: 81, startPage: 102, endPage: 121 },
    7: { number: 7, startSurah: 5, startAyah: 82, endSurah: 6, endAyah: 110, startPage: 122, endPage: 141 },
    8: { number: 8, startSurah: 6, startAyah: 111, endSurah: 7, endAyah: 87, startPage: 142, endPage: 161 },
    9: { number: 9, startSurah: 7, startAyah: 88, endSurah: 8, endAyah: 40, startPage: 162, endPage: 181 },
    10: { number: 10, startSurah: 8, startAyah: 41, endSurah: 9, endAyah: 92, startPage: 182, endPage: 201 },
    11: { number: 11, startSurah: 9, startAyah: 93, endSurah: 11, endAyah: 5, startPage: 202, endPage: 221 },
    12: { number: 12, startSurah: 11, startAyah: 6, endSurah: 12, endAyah: 52, startPage: 222, endPage: 241 },
    13: { number: 13, startSurah: 12, startAyah: 53, endSurah: 14, endAyah: 52, startPage: 242, endPage: 261 },
    14: { number: 14, startSurah: 15, startAyah: 1, endSurah: 16, endAyah: 128, startPage: 262, endPage: 281 },
    15: { number: 15, startSurah: 17, startAyah: 1, endSurah: 18, endAyah: 74, startPage: 282, endPage: 301 },
    16: { number: 16, startSurah: 18, startAyah: 75, endSurah: 20, endAyah: 135, startPage: 302, endPage: 321 },
    17: { number: 17, startSurah: 21, startAyah: 1, endSurah: 22, endAyah: 78, startPage: 322, endPage: 341 },
    18: { number: 18, startSurah: 23, startAyah: 1, endSurah: 25, endAyah: 20, startPage: 342, endPage: 361 },
    19: { number: 19, startSurah: 25, startAyah: 21, endSurah: 27, endAyah: 55, startPage: 362, endPage: 381 },
    20: { number: 20, startSurah: 27, startAyah: 56, endSurah: 29, endAyah: 45, startPage: 382, endPage: 401 },
    21: { number: 21, startSurah: 29, startAyah: 46, endSurah: 33, endAyah: 30, startPage: 402, endPage: 421 },
    22: { number: 22, startSurah: 33, startAyah: 31, endSurah: 36, endAyah: 27, startPage: 422, endPage: 441 },
    23: { number: 23, startSurah: 36, startAyah: 28, endSurah: 39, endAyah: 31, startPage: 442, endPage: 461 },
    24: { number: 24, startSurah: 39, startAyah: 32, endSurah: 41, endAyah: 46, startPage: 462, endPage: 481 },
    25: { number: 25, startSurah: 41, startAyah: 47, endSurah: 45, endAyah: 37, startPage: 482, endPage: 501 },
    26: { number: 26, startSurah: 46, startAyah: 1, endSurah: 51, endAyah: 30, startPage: 502, endPage: 521 },
    27: { number: 27, startSurah: 51, startAyah: 31, endSurah: 57, endAyah: 29, startPage: 522, endPage: 541 },
    28: { number: 28, startSurah: 58, startAyah: 1, endSurah: 66, endAyah: 12, startPage: 542, endPage: 561 },
    29: { number: 29, startSurah: 67, startAyah: 1, endSurah: 77, endAyah: 50, startPage: 562, endPage: 581 },
    30: { number: 30, startSurah: 78, startAyah: 1, endSurah: 114, endAyah: 6, startPage: 582, endPage: 604 }
};

export function getSurahsInJuz(juzNumber: number): number[] {
    const juz = JUZ_META[juzNumber];
    if (!juz) return [];
    const surahs = [];
    for (let i = juz.startSurah; i <= juz.endSurah; i++) {
        surahs.push(i);
    }
    return surahs;
}
