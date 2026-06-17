# Ini Quran (iniquran)

A VS Code extension for reading the Holy Quran -- **fully offline, pure Uthmani Arabic text, no translation**.

## Features

- 📖 **Surah & Juz Navigation**: Browse the Quran by Surah (1-114) or Juz (1-30) directly from the sidebar.
- 🔌 **100% Offline**: Quran data is embedded within the extension, no internet connection required.
- 🎨 **Theme Integration**: Supports both VS Code Dark Mode and Light Mode.
- 🔤 **Font Size**: Adjust Arabic text size directly from the toolbar.

## Development Setup

1.  **Clone or open this folder** in VS Code.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Compile**:
    ```bash
    npm run compile
    ```
4.  **Run Extension**:
    - Press `F5` in VS Code to open the *Extension Development Host*.
    - Click the **Book (Quran)** icon in the Activity Bar to open the navigation panel.

## Usage

1.  Click the **Book (Quran)** icon in the Activity Bar (left side).
2.  Select the **Surah** or **Juz** category.
3.  Click an item to open the reading view in the editor.
4.  Use the top toolbar to navigate pages, switch between Surah/Page mode, or adjust font size.

## Data Source

Quran text (Uthmani) is embedded locally from [Al Quran Cloud API](https://alquran.cloud/api).
