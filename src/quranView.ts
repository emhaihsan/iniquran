import * as vscode from 'vscode';
import { Ayah, Surah } from './api';

export class QuranView {
    public static currentPanel: QuranView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, title: string) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public static revive(panel: vscode.WebviewPanel, title: string) {
        QuranView.currentPanel = new QuranView(panel, title);
        return QuranView.currentPanel;
    }

    public static createOrShow(title: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (QuranView.currentPanel) {
            QuranView.currentPanel._panel.title = title;
            QuranView.currentPanel._panel.reveal(column);
            return QuranView.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'quranView',
            title,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        QuranView.currentPanel = new QuranView(panel, title);
        return QuranView.currentPanel;
    }

    private _lastArabic: Ayah[] = [];
    private _lastTranslation: Ayah[] = [];
    private _lastTitle: string = '';
    public currentSource: { type: 'surah' | 'juz' | 'page', value: any } | undefined;

    public update(arabic: Ayah[], translation: Ayah[], title: string, source?: { type: 'surah' | 'juz' | 'page', value: any }) {
        this._lastArabic = arabic;
        this._lastTranslation = translation;
        this._lastTitle = title;
        if (source) {
            this.currentSource = source;
        }

        const config = vscode.workspace.getConfiguration('iniquran');
        const fontSize = config.get<number>('fontSize', 18);
        const showTranslation = config.get<boolean>('showTranslation', true);
        const language = config.get<string>('translationLanguage', 'id.indonesian');

        this._panel.title = title;
        this._panel.webview.html = this._getHtmlForWebview(arabic, translation, title, fontSize, showTranslation, language);
        
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'updateSetting':
                        await vscode.workspace.getConfiguration('iniquran').update(message.key, message.value, vscode.ConfigurationTarget.Global);
                        
                        // If language changed, we need to notify the extension to re-fetch
                        if (message.key === 'translationLanguage') {
                            vscode.commands.executeCommand('iniquran.refreshView');
                        }
                        return;
                    case 'navigatePage':
                        vscode.commands.executeCommand('iniquran.navigatePage', message.direction);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private _getHtmlForWebview(arabic: Ayah[], translation: Ayah[], title: string, fontSize: number, showTranslation: boolean, language: string) {
        const isPage = this.currentSource?.type === 'page';
        const pageNumber = isPage ? this.currentSource?.value : null;

        const ayahsHtml = arabic.map((ayah, i) => `
            <div class="ayah-container" id="ayah-${ayah.numberInSurah}">
                ${!isPage && i === 0 ? `<div class="surah-info">Surah ${ayah.surah?.englishName}</div>` : ''}
                ${isPage ? `<div class="ayah-meta">Surah ${ayah.surah?.englishName} Ayat ${ayah.numberInSurah}</div>` : ''}
                <div class="arabic">${ayah.text} <span class="ayah-number">${ayah.numberInSurah}</span></div>
                <div class="translation ${showTranslation ? '' : 'hidden'}">${translation[i]?.text || ''}</div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
            --quran-font-size: ${fontSize}px;
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            padding-top: 100px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex;
            flex-direction: column;
            z-index: 1000;
        }
        .toolbar-row {
            height: 40px;
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 20px;
            font-size: 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .toolbar-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 20px;
        }
        .ayah-container {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .ayah-meta {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
        }
        .surah-info {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }
        .arabic {
            font-family: 'Scheherazade New', 'Amiri', serif;
            font-size: calc(var(--quran-font-size) * 1.8);
            direction: rtl;
            text-align: right;
            margin-bottom: 15px;
            line-height: 2;
        }
        .ayah-number {
            font-size: calc(var(--quran-font-size) * 0.8);
            border: 1px solid var(--vscode-descriptionForeground);
            border-radius: 50%;
            padding: 2px 8px;
            margin-right: 10px;
            display: inline-block;
            direction: ltr;
        }
        .translation {
            font-size: var(--quran-font-size);
            color: var(--vscode-descriptionForeground);
        }
        .hidden {
            display: none;
        }
        input[type=range] {
            width: 80px;
        }
        select, button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 2px 8px;
            cursor: pointer;
        }
        select:hover, button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .nav-btn {
            font-weight: bold;
            min-width: 80px;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-row">
            <div class="toolbar-group">
                <label>Ukuran Font:</label>
                <input type="range" id="fontSizeSlider" min="12" max="64" value="${fontSize}">
                <span id="fontSizeDisplay">${fontSize}px</span>
            </div>
            <div class="toolbar-group">
                <label>Terjemahan:</label>
                <select id="langSelect">
                    <option value="id.indonesian" ${language === 'id.indonesian' ? 'selected' : ''}>Indonesia</option>
                    <option value="en.sahih" ${language === 'en.sahih' ? 'selected' : ''}>English</option>
                </select>
                <button id="toggleTranslation">${showTranslation ? 'Sembunyikan' : 'Tampilkan'}</button>
            </div>
        </div>
        ${isPage ? `
        <div class="toolbar-row" style="justify-content: center; gap: 40px;">
            <button class="nav-btn" id="prevPage" ${pageNumber <= 1 ? 'disabled' : ''}>&larr; Halaman ${pageNumber - 1}</button>
            <span style="font-weight: bold;">Halaman ${pageNumber}</span>
            <button class="nav-btn" id="nextPage" ${pageNumber >= 604 ? 'disabled' : ''}>Halaman ${pageNumber + 1} &rarr;</button>
        </div>
        ` : ''}
    </div>
    <div class="header">
        <h1>${title}</h1>
    </div>
    <div class="content">
        ${ayahsHtml}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const slider = document.getElementById('fontSizeSlider');
        const display = document.getElementById('fontSizeDisplay');
        const langSelect = document.getElementById('langSelect');
        const toggleBtn = document.getElementById('toggleTranslation');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            display.innerText = val + 'px';
            document.documentElement.style.setProperty('--quran-font-size', val + 'px');
        });

        slider.addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateSetting',
                key: 'fontSize',
                value: parseInt(e.target.value)
            });
        });

        langSelect.addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateSetting',
                key: 'translationLanguage',
                value: e.target.value
            });
        });

        toggleBtn.addEventListener('click', () => {
            const isHidden = document.querySelector('.translation').classList.contains('hidden');
            const newState = isHidden;
            
            document.querySelectorAll('.translation').forEach(el => {
                el.classList.toggle('hidden');
            });

            toggleBtn.innerText = newState ? 'Sembunyikan' : 'Tampilkan';

            vscode.postMessage({
                command: 'updateSetting',
                key: 'showTranslation',
                value: newState
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'navigatePage', direction: 'prev' });
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'navigatePage', direction: 'next' });
            });
        }
    </script>
</body>
</html>`;
    }

    public dispose() {
        QuranView.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
