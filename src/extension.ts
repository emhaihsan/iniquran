import * as vscode from 'vscode';
import { QuranProvider } from './quranProvider';
import { QuranView } from './quranView';
import { CacheManager } from './cacheManager';
import { getSurahWithTranslation, getPageWithTranslation, search, Surah, Ayah } from './api';
import { JUZ_META } from './quranMeta';

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
            const title = surah.englishName ? `${surah.number}. ${surah.englishName} (${surah.name})` : `Surah ${surah.number}`;
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
            const juz = JUZ_META[juzNumber];
            if (juz) {
                vscode.commands.executeCommand('iniquran.openPage', juz.startPage);
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
                    if (arabic && arabic.length > 0) {
                        view.update(arabic, translation, title, { type: 'page', value: pageNumber });
                    } else {
                        vscode.window.showErrorMessage(`No data found for Page ${pageNumber}`);
                    }
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
