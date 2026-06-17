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
                new QuranItem('Juz', vscode.TreeItemCollapsibleState.Collapsed, 'category', 'juz-root'),
                new QuranItem('Halaman', vscode.TreeItemCollapsibleState.Collapsed, 'category', 'page-root')
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

        if (element.contextValue === 'page-root') {
            // Group pages by 50 to avoid a long list
            const groups = [];
            for (let i = 1; i <= 604; i += 50) {
                const end = Math.min(i + 49, 604);
                groups.push(new QuranItem(
                    `Halaman ${i} - ${end}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'category',
                    `page-group-${i}-${end}`
                ));
            }
            return groups;
        }

        if (element.contextValue?.startsWith('page-group-')) {
            const [, , startStr, endStr] = element.contextValue.split('-');
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            const pages = [];
            for (let i = start; i <= end; i++) {
                pages.push(new QuranItem(
                    `Halaman ${i}`,
                    vscode.TreeItemCollapsibleState.None,
                    'page',
                    'page-item',
                    {
                        command: 'iniquran.openPage',
                        title: 'Open Page',
                        arguments: [i]
                    }
                ));
            }
            return pages;
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
        } else if (type === 'page') {
            this.iconPath = new vscode.ThemeIcon('file-text');
        }
    }
}
