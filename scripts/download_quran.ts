import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://api.alquran.cloud/v1';
const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'quran-uthmani.json');

async function downloadQuran() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('Starting full Quran download (Uthmani)...');
    
    try {
        // Fetch all 604 pages
        const response = await axios.get(`${BASE_URL}/quran/quran-uthmani`);
        const fullData = response.data.data;
        
        // Structure the data for easy offline access (Group by Surah)
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fullData, null, 2));
        console.log(`Success! Full Quran saved to: ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('Failed to download Quran:', error);
    }
}

downloadQuran();
