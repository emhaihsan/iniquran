import * as vscode from 'vscode';
import { QuranView } from './quranView';
import { getSurahs, getSurahDetail, getPageAyahs } from './data';
import { JUZ_META } from './quranMeta';
import { QuranProvider } from './quranProvider';

export function activate(context: vscode.ExtensionContext) {
    // Register Tree Data Provider
    vscode.window.registerTreeDataProvider('quran-navigation', new QuranProvider());

    // Register Webview Serializer for persistence
    vscode.window.registerWebviewPanelSerializer('quranView', {
        async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
            const title = webviewPanel.title;
            QuranView.revive(webviewPanel, title);
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('iniquran.open', () => {
            vscode.commands.executeCommand('iniquran.openPage', 1);
        }),

        vscode.commands.registerCommand('iniquran.openSurah', (surahNumber: number) => {
            const surah = getSurahs().find(s => s.number === surahNumber);
            if (!surah) return;

            const title = `${surah.number}. ${surah.englishName} (${surah.name})`;
            const view = QuranView.createOrShow(title);
            const ayahs = getSurahDetail(surah.number);
            view.update(ayahs, title, { type: 'surah', value: surah.number });
        }),

        vscode.commands.registerCommand('iniquran.openPage', (pageNumber: number) => {
            const title = `Page ${pageNumber}`;
            const view = QuranView.createOrShow(title);

            const ayahs = getPageAyahs(pageNumber);
            if (ayahs.length > 0) {
                view.update(ayahs, title, { type: 'page', value: pageNumber });
            } else {
                vscode.window.showErrorMessage(`No data found for Page ${pageNumber}`);
            }
        }),

        vscode.commands.registerCommand('iniquran.openJuz', (juzNumber: number) => {
            const meta = JUZ_META[juzNumber];
            if (meta) {
                vscode.commands.executeCommand('iniquran.openPage', meta.startPage);
            }
        }),

        vscode.commands.registerCommand('iniquran.navigatePage', (direction: 'prev' | 'next') => {
            if (QuranView.currentPanel && QuranView.currentPanel.currentSource?.type === 'page') {
                const currentPage = QuranView.currentPanel.currentSource.value;
                const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
                if (newPage >= 1 && newPage <= 604) {
                    vscode.commands.executeCommand('iniquran.openPage', newPage);
                }
            }
        }),

        vscode.commands.registerCommand('iniquran.refreshView', () => {
            if (QuranView.currentPanel && QuranView.currentPanel.currentSource) {
                const source = QuranView.currentPanel.currentSource;
                if (source.type === 'surah') {
                    vscode.commands.executeCommand('iniquran.openSurah', source.value);
                } else if (source.type === 'page') {
                    vscode.commands.executeCommand('iniquran.openPage', source.value);
                }
            }
        })
    );
}

export function deactivate() {}
