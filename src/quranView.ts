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

    public update(arabic: Ayah[], translation: Ayah[], title: string) {
        this._panel.title = title;
        this._panel.webview.html = this._getHtmlForWebview(arabic, translation, title);
    }

    private _getHtmlForWebview(arabic: Ayah[], translation: Ayah[], title: string) {
        const ayahsHtml = arabic.map((ayah, i) => `
            <div class="ayah-container" id="ayah-${ayah.numberInSurah}">
                <div class="arabic">${ayah.text} <span class="ayah-number">${ayah.numberInSurah}</span></div>
                <div class="translation">${translation[i]?.text || ''}</div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
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
        .arabic {
            font-family: 'Scheherazade New', 'Amiri', serif;
            font-size: 32px;
            direction: rtl;
            text-align: right;
            margin-bottom: 15px;
            line-height: 2;
        }
        .ayah-number {
            font-size: 18px;
            border: 1px solid var(--vscode-descriptionForeground);
            border-radius: 50%;
            padding: 2px 8px;
            margin-right: 10px;
            display: inline-block;
            direction: ltr;
        }
        .translation {
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
        }
        /* Custom scrollbar for better look */
        ::-webkit-scrollbar {
            width: 10px;
        }
        ::-webkit-scrollbar-track {
            background: var(--vscode-editor-background);
        }
        ::-webkit-scrollbar-thumb {
            background: var(--vscode-widget-border);
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
    </div>
    <div class="content">
        ${ayahsHtml}
    </div>
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
