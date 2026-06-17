import * as vscode from 'vscode';
import { Ayah, Surah } from './api';
import { JUZ_META } from './quranMeta';

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
        const language = config.get<string>('translationLanguage', 'en.sahih');

        this._panel.title = title;

        // If it's the first time or the panel was disposed, set the base HTML
        if (!this._panel.webview.html || this._panel.webview.html === '') {
            this._panel.webview.html = this._getBaseHtml(title, fontSize, showTranslation, language);
        }

        // Send data to the webview for partial update
        const ayahsHtml = this._getAyahsHtml(arabic, translation, showTranslation);
        const isPage = this.currentSource?.type === 'page';
        const pageNumber = isPage ? this.currentSource?.value : null;

        const firstAyah = arabic[0];
        const surahInfo = firstAyah?.surah;
        const juzNumber = firstAyah?.juz;
        const actualPageNumber = firstAyah?.page;

        this._panel.webview.postMessage({
            command: 'updateContent',
            ayahsHtml,
            title,
            isPage,
            pageNumber,
            metadata: {
                surah: `${surahInfo?.englishName} (${surahInfo?.name})`,
                juz: juzNumber,
                page: actualPageNumber
            },
            juzRange: this._getJuzRange(juzNumber)
        });
        
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'updateSetting':
                        await vscode.workspace.getConfiguration('iniquran').update(message.key, message.value, vscode.ConfigurationTarget.Global);
                        if (message.key === 'translationLanguage') {
                            vscode.commands.executeCommand('iniquran.refreshView');
                        }
                        return;
                    case 'navigatePage':
                        vscode.commands.executeCommand('iniquran.navigatePage', message.direction);
                        return;
                    case 'jumpToPage':
                        vscode.commands.executeCommand('iniquran.openPage', message.page);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private _getJuzRange(juz: number | undefined): { start: number, end: number } | null {
        if (!juz) return null;
        const meta = JUZ_META[juz];
        return meta ? { start: meta.startPage, end: meta.endPage } : null;
    }

    private _getAyahsHtml(arabic: Ayah[], translation: Ayah[], showTranslation: boolean): string {
        const isPage = this.currentSource?.type === 'page';
        return arabic.map((ayah, i) => {
            const isNewSurah = i > 0 && ayah.surah?.number !== arabic[i-1].surah?.number;
            return `
                ${isNewSurah ? `<div class="surah-separator">Surah ${ayah.surah?.englishName}</div>` : ''}
                <div class="ayah-container" id="ayah-${ayah.numberInSurah}">
                    <div class="ayah-meta">Surah ${ayah.surah?.englishName} Ayah ${ayah.numberInSurah}</div>
                    <div class="arabic">${ayah.text} <span class="ayah-number">${ayah.numberInSurah}</span></div>
                    <div class="translation ${showTranslation ? '' : 'hidden'}">${translation[i]?.text || ''}</div>
                </div>
            `;
        }).join('');
    }

    private _getBaseHtml(title: string, fontSize: number, showTranslation: boolean, language: string) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --quran-font-size: ${fontSize}px;
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            padding-top: 130px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow-y: scroll;
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
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
        .info-bar {
            background-color: var(--vscode-editor-background);
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: space-around;
            font-size: 13px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .info-item { display: flex; gap: 5px; }
        .info-label { color: var(--vscode-descriptionForeground); font-weight: normal; }
        .ayah-container {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-widget-border);
            animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .surah-separator {
            text-align: center;
            margin: 40px 0;
            padding: 10px;
            background: var(--vscode-sideBar-background);
            font-weight: bold;
            border-radius: 4px;
        }
        .ayah-meta { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 10px; }
        .arabic {
            font-family: 'Scheherazade New', 'Amiri', serif;
            font-size: calc(var(--quran-font-size) * 1.8);
            direction: rtl;
            text-align: right;
            margin-bottom: 15px;
            line-height: 2.2;
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
        .translation { font-size: var(--quran-font-size); color: var(--vscode-descriptionForeground); }
        .hidden { display: none; }
        input[type=range] { width: 80px; }
        select, button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 2px 8px;
            cursor: pointer;
        }
        select:hover, button:hover { background: var(--vscode-button-hoverBackground); }
        .nav-btn { font-weight: bold; min-width: 80px; }
        #loadingOverlay {
            position: fixed;
            top: 130px;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--vscode-editor-background);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 900;
            opacity: 0.7;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--vscode-widget-border);
            border-top: 4px solid var(--vscode-textLink-foreground);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="loadingOverlay"><div class="spinner"></div></div>
    <div class="toolbar">
        <div class="info-bar">
            <div class="info-item"><span class="info-label">Surah:</span><span id="infoSurah">-</span></div>
            <div class="info-item"><span class="info-label">Juz:</span><span id="infoJuz">-</span></div>
            <div class="info-item">
                <span class="info-label">Page:</span>
                <select id="pageSelect" style="background: transparent; color: inherit; font-weight: bold; padding: 0;"></select>
            </div>
        </div>
        <div class="toolbar-row">
            <div class="toolbar-group">
                <label>Font Size:</label>
                <input type="range" id="fontSizeSlider" min="12" max="64" value="${fontSize}">
                <span id="fontSizeDisplay">${fontSize}px</span>
            </div>
            <div class="toolbar-group">
                <label>Translation:</label>
                <select id="langSelect">
                    <option value="en.sahih" ${language === 'en.sahih' ? 'selected' : ''}>English</option>
                    <option value="id.indonesian" ${language === 'id.indonesian' ? 'selected' : ''}>Indonesian</option>
                </select>
                <button id="toggleTranslation">${showTranslation ? 'Hide' : 'Show'}</button>
            </div>
        </div>
        <div id="pageNavRow" class="toolbar-row" style="justify-content: center; gap: 40px; background-color: var(--vscode-sideBar-background); display: none;">
            <div id="prevPageContainer"></div>
            <span id="currentPageDisplay" style="font-weight: bold;"></span>
            <div id="nextPageContainer"></div>
        </div>
    </div>

    <div id="mainHeader" class="header" style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid var(--vscode-widget-border); padding-bottom: 20px;">
        <h1 id="viewTitle">${title}</h1>
    </div>
    <div id="quranContent" class="content"></div>

    <script>
        const vscode = acquireVsCodeApi();
        const contentDiv = document.getElementById('quranContent');
        const viewTitle = document.getElementById('viewTitle');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        // Settings elements
        const slider = document.getElementById('fontSizeSlider');
        const display = document.getElementById('fontSizeDisplay');
        const langSelect = document.getElementById('langSelect');
        const toggleBtn = document.getElementById('toggleTranslation');

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateContent') {
                contentDiv.innerHTML = message.ayahsHtml;
                viewTitle.innerText = message.title;
                
                // Update metadata
                document.getElementById('infoSurah').innerText = message.metadata.surah;
                document.getElementById('infoJuz').innerText = message.metadata.juz;
                
                // Update Page Select Dropdown
                const pageSelect = document.getElementById('pageSelect');
                pageSelect.innerHTML = '';
                if (message.juzRange) {
                    for (let i = message.juzRange.start; i <= message.juzRange.end; i++) {
                        const opt = document.createElement('option');
                        opt.value = i;
                        opt.innerText = i;
                        if (i === message.metadata.page) opt.selected = true;
                        pageSelect.appendChild(opt);
                    }
                } else {
                    const opt = document.createElement('option');
                    opt.value = message.metadata.page;
                    opt.innerText = message.metadata.page;
                    opt.selected = true;
                    pageSelect.appendChild(opt);
                }

                pageSelect.onchange = (e) => {
                    showLoading();
                    vscode.postMessage({ command: 'jumpToPage', page: parseInt(e.target.value) });
                };

                // Update Page Nav
                const navRow = document.getElementById('pageNavRow');
                if (message.isPage) {
                    navRow.style.display = 'flex';
                    document.getElementById('currentPageDisplay').innerText = 'Page ' + message.pageNumber;
                    
                    const prevContainer = document.getElementById('prevPageContainer');
                    const nextContainer = document.getElementById('nextPageContainer');
                    
                    prevContainer.innerHTML = message.pageNumber > 1 ? '<button class="nav-btn" id="prevPage">&larr; Page ' + (message.pageNumber - 1) + '</button>' : '<div style="min-width: 80px;"></div>';
                    nextContainer.innerHTML = message.pageNumber < 604 ? '<button class="nav-btn" id="nextPage">Page ' + (message.pageNumber + 1) + ' &rarr;</button>' : '<div style="min-width: 80px;"></div>';
                    
                    // Re-bind listeners
                    const pBtn = document.getElementById('prevPage');
                    const nBtn = document.getElementById('nextPage');
                    if (pBtn) pBtn.onclick = () => { showLoading(); vscode.postMessage({ command: 'navigatePage', direction: 'prev' }); };
                    if (nBtn) nBtn.onclick = () => { showLoading(); vscode.postMessage({ command: 'navigatePage', direction: 'next' }); };
                } else {
                    navRow.style.display = 'none';
                }
                
                loadingOverlay.style.display = 'none';
                window.scrollTo(0, 0);
            }
        });

        function showLoading() {
            loadingOverlay.style.display = 'flex';
        }

        slider.oninput = (e) => {
            const val = e.target.value;
            display.innerText = val + 'px';
            document.documentElement.style.setProperty('--quran-font-size', val + 'px');
        };

        slider.onchange = (e) => {
            vscode.postMessage({ command: 'updateSetting', key: 'fontSize', value: parseInt(e.target.value) });
        };

        langSelect.onchange = (e) => {
            showLoading();
            vscode.postMessage({ command: 'updateSetting', key: 'translationLanguage', value: e.target.value });
        };

        toggleBtn.onclick = () => {
            const translations = document.querySelectorAll('.translation');
            const isHidden = translations[0]?.classList.contains('hidden');
            translations.forEach(el => el.classList.toggle('hidden'));
            toggleBtn.innerText = isHidden ? 'Hide' : 'Show';
            vscode.postMessage({ command: 'updateSetting', key: 'showTranslation', value: isHidden });
        };
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
