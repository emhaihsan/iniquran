const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'assets', 'data', 'quran-uthmani.json');

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

for (const surah of data.surahs) {
    if (surah.number === 1) { continue; } // Al-Fatiha already separate
    if (surah.number === 9) { continue; } // At-Tawbah has no Bismillah

    const firstAyah = surah.ayahs[0];
    const text = firstAyah.text;

    if (text.startsWith(BISMILLAH)) {
        const remaining = text.slice(BISMILLAH.length).trim();

        // Create Bismillah entry
        const bismillahEntry = {
            number: -1,
            text: BISMILLAH,
            numberInSurah: 0,
            juz: firstAyah.juz,
            manzil: firstAyah.manzil,
            page: firstAyah.page,
            ruku: firstAyah.ruku,
            hizbQuarter: firstAyah.hizbQuarter,
            sajda: false
        };

        // Update first ayah
        firstAyah.text = remaining;

        // Insert bismillah at the beginning
        surah.ayahs.unshift(bismillahEntry);
    }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('Fixed Bismillah in all surahs.');
