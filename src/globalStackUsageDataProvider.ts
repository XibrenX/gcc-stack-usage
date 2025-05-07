import * as vscode from 'vscode';
import { SuStore, SuLine, StackKind } from './suStore';
import * as path from 'path'

class GlobalStackUsageSuLineTreeItem extends vscode.TreeItem
{
    constructor(public readonly suLine: SuLine)
    {
        super([suLine.stack, suLine.stackKind === StackKind.dynamic ? 'dynamic' : undefined].join(' '))
        this.description = suLine.function
        this.command = {
            title: 'Jump to code', command: 'workbench.action.quickOpen', arguments: [`"${suLine.fileName.split(path.sep).at(-1)}":${suLine.position.line + 1}:${suLine.position.character + 1}`] }
        this.tooltip = `${suLine.suFile.file.fsPath.split(path.sep).at(-1)} ${suLine.stack} ${suLine.function}`
    }
}

class GlobalStackUsageCategoryTreeItem extends vscode.TreeItem
{
    constructor(public readonly stackKind: StackKind)
    {
        super(stackKind === StackKind.dynamic ? 'dynamic' : 'static')
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
        Object.setPrototypeOf(this, GlobalStackUsageCategoryTreeItem.prototype);
    }
}

export class GlobalStackUsageDataProvider implements vscode.TreeDataProvider<GlobalStackUsageSuLineTreeItem | GlobalStackUsageCategoryTreeItem>
{
    public showLimit: number = 100

    constructor(private readonly suStore: SuStore)
    {}

    readonly onDidChangeTreeData = this.suStore.onFilesUpdated

    getTreeItem(element: GlobalStackUsageSuLineTreeItem | GlobalStackUsageCategoryTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: GlobalStackUsageSuLineTreeItem | GlobalStackUsageCategoryTreeItem | undefined): vscode.ProviderResult<GlobalStackUsageSuLineTreeItem[] | GlobalStackUsageCategoryTreeItem[]> {
        if (element === undefined)
        {
            return [new GlobalStackUsageCategoryTreeItem(StackKind.dynamic), new GlobalStackUsageCategoryTreeItem(StackKind.static)]
        } 
        else if (element instanceof GlobalStackUsageCategoryTreeItem)
        {
            return this.suStore.files.flatMap(v => v.lines).filter(v => v.stackKind === element.stackKind).sort(SuLine.sortDescending).slice(0, this.showLimit).map(l => new GlobalStackUsageSuLineTreeItem(l))
        }
        else
        {
            return
        }
    }
}