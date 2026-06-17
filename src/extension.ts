import * as vscode from 'vscode';
import { QuranProvider } from './quranProvider';
import { QuranView } from './quranView';
import { getSurahWithTranslation, getJuzWithTranslation, getPageWithTranslation, search, Surah, Ayah } from './api';
import { CacheManager } from './cacheManager';

// Standard Uthmani Mushaf Juz to Page Mapping
const JUZ_TO_PAGE_MAP: { [key: number]: number } = {
    1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182,
    11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
    21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582
};

export function activate(context: vscode.ExtensionContext) {
    // Initialize Cache
    CacheManager.init(context.globalStorageUri.fsPath);

    const quranProvider = new QuranProvider();
    vscode.window.registerTreeDataProvider('quran-navigation', quranProvider);

    // Register Webview Serializer for persistence
    vscode.window.registerWebviewPanelSerializer('quranView', {
        async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
            const title = webviewPanel.title;
            const view = QuranView.revive(webviewPanel, title);
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('iniquran.openSurah', async (surah: Surah) => {
            const title = `${surah.number}. ${surah.englishName} (${surah.name})`;
            const view = QuranView.createOrShow(title);
            
            try {
                const config = vscode.workspace.getConfiguration('iniquran');
                const edition = config.get<string>('translationLanguage', 'en.sahih');

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Loading ${surah.englishName}...`,
                    cancellable: false
                }, async () => {
                    const { arabic, translation } = await getSurahWithTranslation(surah.number, edition);
                    view.update(arabic, translation, title, { type: 'surah', value: surah });
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load Surah: ${error}`);
            }
        }),

        vscode.commands.registerCommand('iniquran.openJuz', async (juzNumber: number) => {
            const pageNumber = JUZ_TO_PAGE_MAP[juzNumber];
            if (pageNumber) {
                vscode.commands.executeCommand('iniquran.openPage', pageNumber);
            }
        }),

        vscode.commands.registerCommand('iniquran.openPage', async (pageNumber: number) => {
            const title = `Page ${pageNumber}`;
            const view = QuranView.createOrShow(title);

            try {
                const config = vscode.workspace.getConfiguration('iniquran');
                const edition = config.get<string>('translationLanguage', 'en.sahih');

                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Loading Page ${pageNumber}...`,
                    cancellable: false
                }, async () => {
                    const { arabic, translation } = await getPageWithTranslation(pageNumber, edition);
                    view.update(arabic, translation, title, { type: 'page', value: pageNumber });
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load Page: ${error}`);
            }
        }),

        vscode.commands.registerCommand('iniquran.navigatePage', async (direction: 'prev' | 'next') => {
            if (QuranView.currentPanel && QuranView.currentPanel.currentSource?.type === 'page') {
                const currentPage = QuranView.currentPanel.currentSource.value;
                const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
                if (newPage >= 1 && newPage <= 604) {
                    vscode.commands.executeCommand('iniquran.openPage', newPage);
                }
            }
        }),

        vscode.commands.registerCommand('iniquran.refreshView', async () => {
            if (QuranView.currentPanel && QuranView.currentPanel.currentSource) {
                const source = QuranView.currentPanel.currentSource;
                if (source.type === 'surah') {
                    vscode.commands.executeCommand('iniquran.openSurah', source.value);
                } else if (source.type === 'juz') {
                    vscode.commands.executeCommand('iniquran.openPage', JUZ_TO_PAGE_MAP[source.value]);
                } else if (source.type === 'page') {
                    vscode.commands.executeCommand('iniquran.openPage', source.value);
                }
            }
        }),

        vscode.commands.registerCommand('iniquran.search', async () => {
            const keyword = await vscode.window.showInputBox({
                prompt: 'Enter search keyword',
                placeHolder: 'Example: patience, prayer, ramadhan'
            });

            if (keyword) {
                try {
                    const config = vscode.workspace.getConfiguration('iniquran');
                    const edition = config.get<string>('translationLanguage', 'en.sahih');

                    const results = await search(keyword, edition);
                    if (results.length === 0) {
                        vscode.window.showInformationMessage('No results found for that keyword.');
                        return;
                    }

                    const items = results.map(ayah => ({
                        label: `Surah ${ayah.surah?.englishName} Ayah ${ayah.numberInSurah}`,
                        description: ayah.text,
                        ayah: ayah
                    }));

                    const selected = await vscode.window.showQuickPick(items, {
                        matchOnDescription: true,
                        placeHolder: `Found ${results.length} results`
                    });

                    if (selected && selected.ayah.surah) {
                        vscode.commands.executeCommand('iniquran.openSurah', selected.ayah.surah);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to perform search: ${error}`);
                }
            }
        })
    );
}

export function deactivate() {}
