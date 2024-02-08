// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SuStore } from './suStore';
import { CodeLensProvider } from './codeLensProvider';
import { GlobalStackUsageDataProvider } from './globalStackUsageDataProvider';
import { CurrentFileStackUsageDataProvider } from './currentFileStackUsageDataProvider';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "gcc-stack-usage" is now active!');

	const suStore = new SuStore()
	context.subscriptions.push(suStore);

	const watcher = vscode.workspace.createFileSystemWatcher('**/*.su');
	watcher.onDidCreate(uri => suStore.onAddOrUpdate(uri))
	watcher.onDidChange(uri => suStore.onAddOrUpdate(uri))
	watcher.onDidDelete(uri => suStore.onDelete(uri))
	context.subscriptions.push(watcher);

	const codeLensProvider = new CodeLensProvider(suStore)
	vscode.languages.registerCodeLensProvider({ language: 'cpp' }, codeLensProvider)
	vscode.languages.registerCodeLensProvider({ language: 'c' }, codeLensProvider)
	vscode.window.registerTreeDataProvider('gcc-stack-usage.globalStackUsage', new GlobalStackUsageDataProvider(suStore))
	vscode.window.registerTreeDataProvider('gcc-stack-usage.currentFileStackUsage', new CurrentFileStackUsageDataProvider(suStore))
	
	context.subscriptions.push(vscode.commands.registerCommand('gcc-stack-usage.updateSuStore', async () => {
		await suStore.update()
	}));

	suStore.update()
}
