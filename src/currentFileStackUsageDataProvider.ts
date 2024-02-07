import * as vscode from 'vscode';
import { SuStore, SuLine } from './suStore';
import * as path from 'path'

class CurrentFileStackUsageTreeItem extends vscode.TreeItem {
    constructor(public readonly suLine: SuLine) {
        super(suLine.stack.toString())
        this.description = suLine.function
        this.tooltip = `${suLine.suFile.file.fsPath.split(path.sep).at(-1)} ${suLine.stack} ${suLine.function}`
    }
}

export class CurrentFileStackUsageDataProvider implements vscode.TreeDataProvider<CurrentFileStackUsageTreeItem>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<void>()

    constructor(private suStore: SuStore) {
        this.suStore.onFilesUpdated(() => this._onDidChangeTreeData.fire())
        vscode.window.onDidChangeActiveTextEditor(() => this._onDidChangeTreeData.fire())
    }

    readonly onDidChangeTreeData = this._onDidChangeTreeData.event

    getTreeItem(element: CurrentFileStackUsageTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: CurrentFileStackUsageTreeItem | undefined): vscode.ProviderResult<CurrentFileStackUsageTreeItem[]> {
        let activeTextEditor = vscode.window.activeTextEditor

        if (element || !activeTextEditor) {
            return []
        }

        const onlyFileName = activeTextEditor.document.fileName.split(path.sep).at(-1)

        return this.suStore.files.flatMap(f => f.lines).filter(l => l.fileName == onlyFileName).sort((la, lb) => lb.stack - la.stack).map(l => new CurrentFileStackUsageTreeItem(l))
    }

    resolveTreeItem(item: vscode.TreeItem, element: CurrentFileStackUsageTreeItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem>
    {
        let activeTextEditor = vscode.window.activeTextEditor
        if (activeTextEditor)
        {
            item.command = { title: 'Jump to position', command: 'editor.action.goToLocations', arguments: [activeTextEditor.document.uri, activeTextEditor.selection.start, [new vscode.Location(activeTextEditor.document.uri, element.suLine.position)], 'goto', 'Position not found'] }
        }

        return item
    }
}
