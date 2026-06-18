# Change Log

All notable changes to the "Ini Quran" extension will be documented in this file.

## [1.0.4] - 2026-06-18

### Changed
- Upgraded embedded font to KFGQPC Uthmanic Hafs V2 for improved diacritic composition.
- Added OpenType feature settings (`font-feature-settings`) to enable contextual ligatures and glyph composition.
- Removed 4,807 U+06ED (small low meem) tajwid notation characters from `quran-uthmani.json` that were incorrectly rendering as visible small mim under tanwin.

## [1.0.3] - 2026-06-18

### Added
- Embedded KFGQPC Uthmanic Hafs font for authentic mushaf rendering.
- Fixed incorrect diacritic display for fathah, kasrah, and tanwin combinations.

## [1.0.2] - 2026-06-18

### Fixed
- Corrected Arabic diacritics in Surah Al-Ahzab (33:40).

## [1.0.1] - 2026-06-17

### Fixed
- Separated Bismillah from the first ayah in each Surah (except At-Tawbah).
- Adjusted toolbar padding so content no longer overlaps in Juz mode.
- Removed large header and Latin text labels from Quran view for a cleaner reading experience.

## [1.0.0] - 2026-06-17

### Added
- Initial release of Ini Quran.
- Fully offline Quran reader with Uthmani script.
- Surah and Juz navigation in the sidebar.
- Adjustable font size via settings.
