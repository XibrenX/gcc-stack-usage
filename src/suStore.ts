import * as vscode from 'vscode';
import * as path from 'path'
import { AsyncOperationsStore } from './asyncOperationsStore';

export enum StackKind {
    static,
    dynamic
}

export class SuLine {
    readonly fileName: string
    readonly position: vscode.Position
    readonly function: string
    readonly stack: number
    readonly stackKind: StackKind

    constructor(line: string, public readonly suFile: SuFile, public readonly suPosition: vscode.Position) {
        let parts = line.split('\t')

        let firstParts = parts[0].split(':')
        this.fileName = firstParts[0]
        this.position = new vscode.Position(Number(firstParts[1]) -1, Number(firstParts[2]) -1)
        this.function = firstParts.slice(3).join(':')

        this.stack = Number(parts[1])
        this.stackKind = parts[2] == 'static' ? StackKind.static : StackKind.dynamic
    }

    matchesFileName(otherFileName: string): boolean
    {
        let matchFileName = this.fileName
        if (!matchFileName.startsWith(path.sep))
        {
            matchFileName = path.sep + matchFileName
        }

        return otherFileName.endsWith(matchFileName)
    }

    static sortDescending(lhs: SuLine, rhs: SuLine): number
    {
        if (lhs.stackKind !== rhs.stackKind)
        {
            return rhs.stackKind - lhs.stackKind;
        }
        return rhs.stack - lhs.stack;
    }
}

export class SuFile
{
    private readonly _lines: SuLine[] = []
    
    public get lines(): SuLine[] { 
        return this._lines
    }

    constructor(public readonly file: vscode.Uri, public lastWritten: number = 0) {
        this._lines = []
    }

    async update()
    {
        this.lines.length = 0

        try
        {
            const stat = await vscode.workspace.fs.stat(this.file)
            this.lastWritten = stat.mtime

            const content = await vscode.workspace.fs.readFile(this.file)
            const contentStr = Buffer.from(content).toString('utf8');

            let start = 0
            let lineIndex = 0
            while (start < contentStr.length) {
                const end = contentStr.indexOf('\n', start)
                this._lines.push(new SuLine(contentStr.substring(start, end), this, new vscode.Position(lineIndex, 0)))
                start = end + 1
                lineIndex += 1
            }
        }
        catch (error)
        {
            console.error(error)
        }
    }

    onDelete()
    {
        this.lines.length = 0
        this.lastWritten = new Date().getTime()
    }
}

export class SuStore
{
    private readonly _files = new Map<string, SuFile>()
    private readonly _asyncOperationsStore = new AsyncOperationsStore()

    public get onFilesUpdated(): vscode.Event<void> { return this._asyncOperationsStore.onAllOperationsDone }
    public get files(): SuFile[] { return Array.from(this._files.values()) }

    update()
    {
        this._asyncOperationsStore.addOperation(async () => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                cancellable: false,
                title: 'Reading su files'
            }, async (progress) => {

                progress.report({ increment: 0 });
                for(const file of this.files)
                {
                    file.onDelete()
                }

                let uris = await vscode.workspace.findFiles('**/*.su', null)
                await Promise.all(uris.map(async uri => {
                    let suFile = this._files.get(uri.fsPath) ?? new SuFile(uri)
                    this._files.set(uri.fsPath, suFile)

                    await suFile.update()
                }))
                console.log(`Found ${this._files.size} .su files`)

                progress.report({ increment: 100 });

                if (this._files.size == 0)
                {
                    vscode.window.showWarningMessage('No .su files found!\nPlease compile with `-fstack-usage`.')
                }
            })
        })
    }

    onAddOrUpdate(uri: vscode.Uri)
    {
        this._asyncOperationsStore.addOperation(async () => {
            console.log(`On add or update ${uri.fsPath}`)
            let suFile = this._files.get(uri.fsPath) ?? new SuFile(uri)
            this._files.set(uri.fsPath, suFile)
            await suFile.update()
        })
    }

    onDelete(uri: vscode.Uri)
    {
        this._asyncOperationsStore.addOperation(async () => {
            console.log(`On delete ${uri.fsPath}`)
            let suFile = this._files.get(uri.fsPath)
            if (suFile) {
                suFile.onDelete()
            }
        })
    }

    dispose()
    {
        this._asyncOperationsStore.dispose()
        this._files.clear()
    }
}