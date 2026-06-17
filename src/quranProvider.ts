import * as vscode from 'vscode';
import { getSurahs, Surah } from './api';

export class QuranProvider implements vscode.TreeDataProvider<QuranItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QuranItem | undefined | void> = new vscode.EventEmitter<QuranItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<QuranItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: QuranItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: QuranItem): Promise<QuranItem[]> {
        if (!element) {
            return [
                new QuranItem('Surah', vscode.TreeItemCollapsibleState.Collapsed, 'category', 'surah-root'),
                new QuranItem('Juz', vscode.TreeItemCollapsibleState.Collapsed, 'category', 'juz-root')
            ];
        }

        if (element.contextValue === 'surah-root') {
            const surahs = await getSurahs();
            return surahs.map(s => new QuranItem(
                `${s.number}. ${s.englishName} (${s.name})`,
                vscode.TreeItemCollapsibleState.None,
                'surah',
                'surah-item',
                {
                    command: 'iniquran.openSurah',
                    title: 'Open Surah',
                    arguments: [s]
                }
            ));
        }

        if (element.contextValue === 'juz-root') {
            const juzs = Array.from({ length: 30 }, (_, i) => i + 1);
            return juzs.map(j => new QuranItem(
                `Juz ${j}`,
                vscode.TreeItemCollapsibleState.None,
                'juz',
                'juz-item',
                {
                    command: 'iniquran.openJuz',
                    title: 'Open Juz',
                    arguments: [j]
                }
            ));
        }

        return [];
    }
}

export class QuranItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        contextValue: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        
        if (type === 'surah') {
            this.iconPath = new vscode.ThemeIcon('book');
        } else if (type === 'juz') {
            this.iconPath = new vscode.ThemeIcon('layers');
        }
    }
}
