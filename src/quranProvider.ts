import * as vscode from 'vscode';
import { getSurahs } from './data';

export class QuranProvider implements vscode.TreeDataProvider<QuranItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<QuranItem | undefined | void> = new vscode.EventEmitter<QuranItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<QuranItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: QuranItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: QuranItem): QuranItem[] {
        if (!element) {
            return [
                new QuranItem(
                    'Surah',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'category',
                    'category-surah'
                ),
                new QuranItem(
                    'Juz',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'category',
                    'category-juz'
                )
            ];
        }

        if (element.type === 'category') {
            if (element.contextValue === 'category-surah') {
                const surahs = getSurahs();
                return surahs.map(s => new QuranItem(
                    `${s.number}. ${s.englishName} (${s.name})`,
                    vscode.TreeItemCollapsibleState.None,
                    'surah',
                    'surah-item',
                    {
                        command: 'iniquran.openSurah',
                        title: 'Open Surah',
                        arguments: [s.number]
                    }
                ));
            } else if (element.contextValue === 'category-juz') {
                return Array.from({ length: 30 }, (_, i) => i + 1).map(j => new QuranItem(
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
        } else if (type === 'category') {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}
