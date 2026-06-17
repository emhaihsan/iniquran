import * as vscode from 'vscode';
import { QuranProvider } from './quranProvider';
import { QuranView } from './quranView';
import { getSurahWithTranslation, getJuzWithTranslation, search, Surah, Ayah } from './api';

export function activate(context: vscode.ExtensionContext) {
    const quranProvider = new QuranProvider();
    vscode.window.registerTreeDataProvider('quran-navigation', quranProvider);

    // Register Webview Serializer for persistence
    vscode.window.registerWebviewPanelSerializer('quranView', {
        async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
            const title = webviewPanel.title;
            const view = QuranView.revive(webviewPanel, title);
            
            // If there's saved state, we could restore content immediately
            // For now, it will just show the last title and wait for content
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('iniquran.openSurah', async (surah: Surah) => {
            const title = `${surah.number}. ${surah.englishName} (${surah.name})`;
            const view = QuranView.createOrShow(title);
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Memuat ${surah.englishName}...`,
                    cancellable: false
                }, async () => {
                    const { arabic, translation } = await getSurahWithTranslation(surah.number);
                    view.update(arabic, translation, title);
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Gagal memuat Surah: ${error}`);
            }
        }),

        vscode.commands.registerCommand('iniquran.openJuz', async (juzNumber: number) => {
            const title = `Juz ${juzNumber}`;
            const view = QuranView.createOrShow(title);

            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Memuat Juz ${juzNumber}...`,
                    cancellable: false
                }, async () => {
                    const { arabic, translation } = await getJuzWithTranslation(juzNumber);
                    view.update(arabic, translation, title);
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Gagal memuat Juz: ${error}`);
            }
        }),

        vscode.commands.registerCommand('iniquran.search', async () => {
            const keyword = await vscode.window.showInputBox({
                prompt: 'Masukkan kata kunci pencarian (Bahasa Indonesia)',
                placeHolder: 'Contoh: sabar, shalat, ramadhan'
            });

            if (keyword) {
                try {
                    const results = await search(keyword);
                    if (results.length === 0) {
                        vscode.window.showInformationMessage('Tidak ditemukan hasil untuk kata kunci tersebut.');
                        return;
                    }

                    const items = results.map(ayah => ({
                        label: `Surah ${ayah.surah?.englishName} Ayah ${ayah.numberInSurah}`,
                        description: ayah.text,
                        ayah: ayah
                    }));

                    const selected = await vscode.window.showQuickPick(items, {
                        matchOnDescription: true,
                        placeHolder: `Ditemukan ${results.length} hasil`
                    });

                    if (selected && selected.ayah.surah) {
                        vscode.commands.executeCommand('iniquran.openSurah', selected.ayah.surah);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Gagal melakukan pencarian: ${error}`);
                }
            }
        })
    );
}

export function deactivate() {}
