import * as vscode from 'vscode';
import { Ayah, getSurahs } from './data';
import { JUZ_META } from './quranMeta';

export class QuranView {
    public static currentPanel: QuranView | undefined;
    public static extensionUri: vscode.Uri | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, title: string) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'updateSetting':
                        vscode.workspace.getConfiguration('iniquran').update(message.key, message.value, vscode.ConfigurationTarget.Global);
                        return;
                    case 'navigatePage':
                        vscode.commands.executeCommand('iniquran.navigatePage', message.direction);
                        return;
                    case 'jumpToPage':
                        vscode.commands.executeCommand('iniquran.openPage', message.page);
                        return;
                    case 'jumpToSurah':
                        vscode.commands.executeCommand('iniquran.openSurah', parseInt(message.surahNumber));
                        return;
                    case 'switchMode':
                        if (message.mode === 'surah') {
                            const firstAyah = this._lastArabic[0];
                            if (firstAyah?.surah) {
                                vscode.commands.executeCommand('iniquran.openSurah', firstAyah.surah.number);
                            }
                        } else if (message.mode === 'juz') {
                            const firstAyah = this._lastArabic[0];
                            if (firstAyah?.page) {
                                vscode.commands.executeCommand('iniquran.openPage', firstAyah.page);
                            }
                        }
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static setExtensionUri(uri: vscode.Uri) {
        QuranView.extensionUri = uri;
    }

    public static revive(panel: vscode.WebviewPanel, title: string) {
        QuranView.currentPanel = new QuranView(panel, title);
        return QuranView.currentPanel;
    }

    public static createOrShow(title: string) {
        if (QuranView.currentPanel) {
            QuranView.currentPanel._panel.reveal(vscode.ViewColumn.One);
            return QuranView.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            'quranView',
            title,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        QuranView.currentPanel = new QuranView(panel, title);
        return QuranView.currentPanel;
    }

    private _lastArabic: Ayah[] = [];
    private _lastTitle: string = '';
    public currentSource: { type: 'surah' | 'page', value: number } | undefined;
    private _navigationMode: 'surah' | 'juz' = 'juz';

    public update(arabic: Ayah[], title: string, source?: { type: 'surah' | 'page', value: number }) {
        this._lastArabic = arabic;
        this._lastTitle = title;
        if (source) {
            this.currentSource = source;
            if (source.type === 'surah') { this._navigationMode = 'surah'; }
            else { this._navigationMode = 'juz'; }
        }

        const config = vscode.workspace.getConfiguration('iniquran');
        const fontSize = config.get<number>('fontSize', 18);

        this._panel.title = title;

        if (!this._panel.webview.html || this._panel.webview.html === '') {
            const allSurahs = getSurahs();
            this._panel.webview.html = this._getBaseHtml(title, fontSize, allSurahs);
        }

        const ayahsHtml = this._getAyahsHtml(arabic);
        const firstAyah = arabic[0];
        const surahInfo = firstAyah?.surah;

        this._panel.webview.postMessage({
            command: 'updateContent',
            ayahsHtml,
            title,
            navigationMode: this._navigationMode,
            metadata: {
                surah: surahInfo?.number,
                surahName: `${surahInfo?.englishName} (${surahInfo?.name})`,
                juz: firstAyah?.juz,
                page: firstAyah?.page
            },
            juzRange: this._getJuzRange(firstAyah?.juz)
        });

    }

    private _getJuzRange(juz: number | undefined): { start: number, end: number } | null {
        if (!juz) return null;
        const meta = JUZ_META[juz];
        return meta ? { start: meta.startPage, end: meta.endPage } : null;
    }

    private _getAyahsHtml(arabic: Ayah[]): string {
        return arabic.map((ayah) => {
            const isBismillah = ayah.numberInSurah === 0;
            const numberBadge = isBismillah ? '' : `<span class="ayah-number">${ayah.numberInSurah}</span>`;
            const containerClass = isBismillah ? 'bismillah-container' : 'ayah-container';
            return `
                <div class="${containerClass}" id="ayah-${ayah.numberInSurah}">
                    <div class="arabic">${ayah.text}${numberBadge}</div>
                </div>
            `;
        }).join('');
    }

    private _getBaseHtml(title: string, fontSize: number, surahs: { number: number, englishName: string }[]) {
        const surahOptions = surahs.map(s => `<option value="${s.number}">${s.number}. ${s.englishName}</option>`).join('');

        let fontFaceCss = '';
        if (QuranView.extensionUri) {
            const fontPath = vscode.Uri.joinPath(QuranView.extensionUri, 'assets', 'fonts', 'KFGQPCUthmanicHafsV2.ttf');
            const fontUri = this._panel.webview.asWebviewUri(fontPath);
            fontFaceCss = `
                @font-face {
                    font-family: 'UthmanicHafs';
                    src: url('${fontUri}') format('truetype');
                    font-display: swap;
                }
            `;
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${fontFaceCss}
        :root { --quran-font-size: ${fontSize}px; }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px; padding-top: 170px;
            line-height: 1.6; color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            overflow-y: scroll;
        }
        .toolbar {
            position: fixed; top: 0; left: 0; right: 0;
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex; flex-direction: column; z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .toolbar-row {
            height: 40px; display: flex; align-items: center;
            padding: 0 20px; gap: 20px; font-size: 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .nav-mode-row { justify-content: center; background: var(--vscode-editor-background); height: 30px; border-bottom: 1px solid var(--vscode-widget-border); }
        .info-bar {
            background-color: var(--vscode-sideBar-background);
            height: 40px; display: flex; align-items: center;
            justify-content: space-around; font-size: 13px;
            font-weight: bold; color: var(--vscode-textLink-foreground);
        }
        .info-item { display: flex; align-items: center; gap: 8px; }
        .info-label { color: var(--vscode-descriptionForeground); font-weight: normal; }
        .ayah-container { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--vscode-widget-border); animation: fadeIn 0.3s ease-in; }
        .bismillah-container { margin-bottom: 20px; padding-bottom: 15px; text-align: center; border-bottom: 1px solid var(--vscode-widget-border); animation: fadeIn 0.3s ease-in; }
        .bismillah-container .arabic { font-size: calc(var(--quran-font-size) * 1.4); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .arabic { font-family: 'UthmanicHafs', 'Scheherazade New', 'Amiri', serif; font-size: calc(var(--quran-font-size) * 1.8); direction: rtl; text-align: right; margin-bottom: 15px; line-height: 2.2; font-feature-settings: "ccmp" 1, "calt" 1, "liga" 1, "dlig" 1; -webkit-font-feature-settings: "ccmp" 1, "calt" 1, "liga" 1, "dlig" 1; font-variant-ligatures: contextual; }
        .ayah-number { font-size: calc(var(--quran-font-size) * 0.8); border: 1px solid var(--vscode-descriptionForeground); border-radius: 50%; padding: 2px 8px; margin-right: 10px; display: inline-block; direction: ltr; }
        select, button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 8px; cursor: pointer; }
        select:hover, button:hover { background: var(--vscode-button-hoverBackground); }
        #loadingOverlay { position: fixed; top: 170px; left: 0; right: 0; bottom: 0; background: var(--vscode-editor-background); display: none; justify-content: center; align-items: center; z-index: 900; opacity: 0.7; }
        .spinner { width: 40px; height: 40px; border: 4px solid var(--vscode-widget-border); border-top: 4px solid var(--vscode-textLink-foreground); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .mode-switch { display: flex; gap: 15px; align-items: center; }
        .mode-switch label { cursor: pointer; display: flex; align-items: center; gap: 5px; }
    </style>
</head>
<body>
    <div id="loadingOverlay"><div class="spinner"></div></div>
    <div class="toolbar">
        <div class="nav-mode-row toolbar-row">
            <div class="mode-switch">
                <span class="info-label">Navigation Mode:</span>
                <label><input type="radio" name="navMode" value="juz" id="modeJuz"> Juz / Page</label>
                <label><input type="radio" name="navMode" value="surah" id="modeSurah"> Surah</label>
            </div>
        </div>
        <div class="info-bar">
            <div class="info-item"><span class="info-label">Surah:</span><span id="displaySurahName">-</span></div>
            <div id="juzInfo" class="info-item"><span class="info-label">Juz:</span><span id="displayJuzNum">-</span></div>
            <div class="info-item">
                <span id="selectorLabel" class="info-label">Page:</span>
                <select id="mainSelector" style="background: var(--vscode-dropdown-background); color: var(--vscode-dropdown-foreground); border: 1px solid var(--vscode-dropdown-border); font-weight: bold;">
                    <option id="pagePlaceholder">Loading...</option>
                </select>
                <div id="surahSelectorContainer" style="display:none;">
                    <select id="surahSelect">${surahOptions}</select>
                </div>
            </div>
        </div>
        <div class="toolbar-row">
            <div class="toolbar-group">
                <label>Font Size:</label>
                <input type="range" id="fontSizeSlider" min="12" max="64" value="${fontSize}">
                <span id="fontSizeDisplay">${fontSize}px</span>
            </div>
        </div>
        <div id="pageNavRow" class="toolbar-row" style="justify-content: center; gap: 40px; background-color: var(--vscode-sideBar-background); display: none;">
            <div id="prevPageContainer"></div>
            <span id="currentPageDisplay" style="font-weight: bold;"></span>
            <div id="nextPageContainer"></div>
        </div>
    </div>

    <div id="quranContent" class="content"></div>

    <script>
        const vscode = acquireVsCodeApi();
        const contentDiv = document.getElementById('quranContent');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const mainSelector = document.getElementById('mainSelector');
        const surahSelect = document.getElementById('surahSelect');
        const modeJuz = document.getElementById('modeJuz');
        const modeSurah = document.getElementById('modeSurah');

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateContent') {
                contentDiv.innerHTML = message.ayahsHtml;
                document.getElementById('displaySurahName').innerText = message.metadata.surahName;
                document.getElementById('displayJuzNum').innerText = message.metadata.juz;

                // Sync Radios
                if (message.navigationMode === 'juz') modeJuz.checked = true;
                else modeSurah.checked = true;

                // Setup Selector
                if (message.navigationMode === 'juz') {
                    document.getElementById('selectorLabel').innerText = 'Page:';
                    mainSelector.style.display = 'inline-block';
                    surahSelect.parentElement.style.display = 'none';
                    mainSelector.innerHTML = '';
                    if (message.juzRange) {
                        for (let i = message.juzRange.start; i <= message.juzRange.end; i++) {
                            const opt = document.createElement('option');
                            opt.value = i; opt.innerText = i;
                            if (i === message.metadata.page) opt.selected = true;
                            mainSelector.appendChild(opt);
                        }
                    }
                } else {
                    document.getElementById('selectorLabel').innerText = 'Surah:';
                    mainSelector.style.display = 'none';
                    surahSelect.parentElement.style.display = 'inline-block';
                    surahSelect.value = message.metadata.surah;
                }

                // Update Nav Row
                const navRow = document.getElementById('pageNavRow');
                if (message.navigationMode === 'juz') {
                    navRow.style.display = 'flex';
                    document.getElementById('currentPageDisplay').innerText = 'Page ' + message.metadata.page;
                    document.getElementById('prevPageContainer').innerHTML = message.metadata.page > 1 ? '<button class="nav-btn" id="prevPage">&larr; Page ' + (message.metadata.page - 1) + '</button>' : '<div style="min-width: 80px;"></div>';
                    document.getElementById('nextPageContainer').innerHTML = message.metadata.page < 604 ? '<button class="nav-btn" id="nextPage">Page ' + (message.metadata.page + 1) + ' &rarr;</button>' : '<div style="min-width: 80px;"></div>';
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

        function showLoading() { loadingOverlay.style.display = 'flex'; }

        modeJuz.onchange = () => vscode.postMessage({ command: 'switchMode', mode: 'juz' });
        modeSurah.onchange = () => vscode.postMessage({ command: 'switchMode', mode: 'surah' });
        mainSelector.onchange = (e) => { showLoading(); vscode.postMessage({ command: 'jumpToPage', page: parseInt(e.target.value) }); };
        surahSelect.onchange = (e) => { showLoading(); vscode.postMessage({ command: 'jumpToSurah', surahNumber: e.target.value }); };

        document.getElementById('fontSizeSlider').oninput = (e) => {
            const val = e.target.value;
            document.getElementById('fontSizeDisplay').innerText = val + 'px';
            document.documentElement.style.setProperty('--quran-font-size', val + 'px');
        };
        document.getElementById('fontSizeSlider').onchange = (e) => vscode.postMessage({ command: 'updateSetting', key: 'fontSize', value: parseInt(e.target.value) });
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
