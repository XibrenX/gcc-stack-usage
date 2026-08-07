import * as vscode from 'vscode';
import { StackKind, SuLine, SuStore } from './suStore';

function getOrAdd<TKey, TValue>(map: Map<TKey, TValue>, key: TKey, create: () => TValue): TValue {
    let value = map.get(key);
    if (value === undefined) {
        value = create();
        map.set(key, value);
    }
    return value;
}

function lineGetTitle(line: SuLine) {
    return ['Stack:', line.stack, line.stackKind === StackKind.dynamic ? 'dynamic' : undefined].filter(Boolean).join(' ');
}

function getTooltip(lines: SuLine[]): string {
    if (lines.length === 1)
        return lines.at(0)!.function;

    const functionsGrouped = new Map<string, number>();
    for (const line of lines) {
        const current = functionsGrouped.get(line.function) ?? 0;
        functionsGrouped.set(line.function, current + 1);
    }

    return Array.from(functionsGrouped).map((item) => `${item[1]}x ${item[0]}`).join('\n');
}

export class CodeLensProvider implements vscode.CodeLensProvider {
    constructor(private readonly suStore: SuStore) {
        this.onDidChangeCodeLenses = this.suStore.onFilesUpdated;
    }

    readonly onDidChangeCodeLenses;

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        const lines = this.suStore.files.flatMap(f => f.lines).filter(l => l.matchesFileName(document.fileName));
        const grouped = new Map<number, Map<string, SuLine[]>>();

        for (const line of lines) {
            const groupedByLine = getOrAdd(grouped, line.position.line, () => new Map<string, SuLine[]>());
            const title = lineGetTitle(line);
            const groupedByTitle = getOrAdd(groupedByLine, title, () => []);
            groupedByTitle.push(line);
        }

        const codeLenses: vscode.CodeLens[] = [];
        for (const documentLineGroup of grouped.values()) {
            for (const titleGroup of documentLineGroup.values()) {
                const position = titleGroup.at(0)!.position;
                const range = new vscode.Range(position, position);
                let title = lineGetTitle(titleGroup.at(0)!);
                if (titleGroup.length > 1) {
                    title += ` (${titleGroup.length}x)`;
                }

                codeLenses.push(new vscode.CodeLens(range, {
                    title: title,
                    tooltip: getTooltip(titleGroup),
                    command: 'editor.action.goToLocations',
                    arguments: [
                        document.uri,
                        position,
                        titleGroup.map(l => new vscode.Location(l.suFile.file, l.suPosition)),
                        titleGroup.length == 1 ? 'goto' : 'peek',
                        'Su reference not found'
                    ]
                }));
            }
        }

        console.log(`Created ${codeLenses.length} for ${lines.length} su lines for ${document.fileName}`);

        return codeLenses;
    }
    resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
        return codeLens;
    }

}