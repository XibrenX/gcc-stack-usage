import * as vscode from 'vscode';
import { StackKind, SuStore } from './suStore';

export class CodeLensProvider implements vscode.CodeLensProvider
{
    constructor(private readonly suStore: SuStore)
    {
    }

    readonly onDidChangeCodeLenses = this.suStore.onFilesUpdated

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        let lines = this.suStore.files.flatMap(f => f.lines).filter(l => l.matchesFileName(document.fileName))

        let codeLenses = []
        for (const line of lines)
        {
            const range = document.getWordRangeAtPosition(line.position)
            if (range)
            {
                const title = ['Stack:', line.stack, line.stackKind === StackKind.dynamic ? 'dynamic' : undefined].filter(Boolean).join(' ')
                codeLenses.push(new vscode.CodeLens(range, { title: title, tooltip: line.function, command: 'editor.action.goToLocations', arguments: [document.uri, line.position, [new vscode.Location(line.suFile.file, line.suPosition)], 'goto', 'Su reference not found']}))
            }
            else
            {
                console.warn(`Did not found word range for ${line.position.line}:${line.position.character}`)
            }
        }

        console.log(`Created ${codeLenses.length} for ${lines.length} su lines for ${document.fileName}`)

        return codeLenses
    }
    resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
        return codeLens
    }

}