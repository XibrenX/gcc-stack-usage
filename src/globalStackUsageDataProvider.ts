import * as vscode from 'vscode';
import { SuStore, SuLine } from './suStore';
import * as path from 'path'

class GlobalStackUsageTreeItem extends vscode.TreeItem
{
    constructor(public readonly suLine: SuLine)
    {
        super(suLine.stack.toString())
        this.description = suLine.function
        this.command = {
            title: 'Jump to code', command: 'workbench.action.quickOpen', arguments: [`"${suLine.fileName}":${suLine.position.line + 1}:${suLine.position.character + 1}`] }
        this.tooltip = `${suLine.suFile.file.fsPath.split(path.sep).at(-1)} ${suLine.stack} ${suLine.function}`
    }
}

export class GlobalStackUsageDataProvider implements vscode.TreeDataProvider<GlobalStackUsageTreeItem>
{
    constructor(private suStore: SuStore)
    {}

    readonly onDidChangeTreeData = this.suStore.onFilesUpdated

    getTreeItem(element: GlobalStackUsageTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: GlobalStackUsageTreeItem | undefined): vscode.ProviderResult<GlobalStackUsageTreeItem[]> {
        if (element)
        {
            return []
        }

        return this.suStore.files.flatMap(v => v.lines).sort((la, lb) => lb.stack - la.stack).slice(0, 100).map(l => new GlobalStackUsageTreeItem(l))
    }
}