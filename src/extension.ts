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
	console.log('Congratulations, your extension "gcc-advanced" is now active!');

	// const watcher = vscode.workspace.createFileSystemWatcher('**/*.su');
	// watcher.onDidChange(uri => console.log('Watcher onDidChange: ' + uri.toString()))
	// watcher.onDidCreate(uri => console.log('Watcher onDidCreate: ' + uri.toString()))
	// watcher.onDidDelete(uri => console.log('Watcher onDidDelete: ' + uri.toString()))
	// context.subscriptions.push(watcher);

	const suStore = new SuStore()
	context.subscriptions.push(suStore);

	vscode.languages.registerCodeLensProvider({ language: 'cpp'}, new CodeLensProvider(suStore))
	vscode.window.registerTreeDataProvider('gcc-advanced.globalStackUsage', new GlobalStackUsageDataProvider(suStore))
	vscode.window.registerTreeDataProvider('gcc-advanced.currentFileStackUsage', new CurrentFileStackUsageDataProvider(suStore))
	

	context.subscriptions.push(vscode.commands.registerCommand('gcc-advanced.updateSuStore', async () => {
		suStore.update()
	}));
}
