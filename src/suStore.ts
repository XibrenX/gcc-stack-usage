import * as vscode from 'vscode';

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
}

export class SuFile
{
    private _lines: SuLine[]
    
    public get lines(): SuLine[] { 
        return this._lines
    }

    private constructor(public readonly file: vscode.Uri, public readonly lastWritten: number) {
        this._lines = []
    }

    static async getFile(file: vscode.Uri): Promise<SuFile>
    {
        const stat = await vscode.workspace.fs.stat(file)
        let suFile = new SuFile(file, stat.mtime)

        const content = await vscode.workspace.fs.readFile(file)
        const contentStr = Buffer.from(content).toString('utf8');

        var start = 0
        var lineIndex = 0
        while (start < contentStr.length)
        {
            const end = contentStr.indexOf('\n', start)
            suFile._lines.push(new SuLine(contentStr.substring(start, end), suFile, new vscode.Position(lineIndex, 0)))
            start = end + 1
            lineIndex += 1
        }

        return suFile
    }
}

export class SuStore
{
    private _files: SuFile[] = []
    private _onFilesUpdated: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onFilesUpdated: vscode.Event<void> = this._onFilesUpdated.event

    public get files(): SuFile[] { return this._files }

    async update()
    {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: 'Reading su files'
        }, async (progress) => {

            progress.report({ increment: 0 });

            this._files = []
            let uris = await vscode.workspace.findFiles('**/*.su', null)
            await Promise.all(uris.map(async uri => this._files.push(await SuFile.getFile(uri))))
            console.log(`Found ${this._files.length} .su files`)

            progress.report({ increment: 100 });

            if (this._files.length == 0)
            {
                vscode.window.showWarningMessage('No .su files found!\nPlease compile with `-fstack-usage`.')
            }
        });
        this._onFilesUpdated.fire()
    }

    dispose()
    {
        this._files = []
    }
}