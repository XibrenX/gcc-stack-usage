import * as vscode from 'vscode';

const DEFAULT_TIMEOUT_MS = 1000

export class AsyncOperationsStore
{
    private _timerRunning: Boolean = false
    private _timerId: NodeJS.Timeout | null = null
    private _timerInvalidated: Boolean = false
    private _store: Array<() => Promise<any>> = []
    private _disposed: Boolean = false

    private _onAllOperationsDone: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onAllOperationsDone: vscode.Event<void> = this._onAllOperationsDone.event

    addOperation(operation: () => Promise<any>)
    {
        this._store.push(operation)
        if (this._timerRunning)
        {
            this._timerInvalidated = true
            console.log('AsyncOperationsStore: Timer invalidated')
        }
        else
        {
            this.startTimer()
        }
        console.log('AsyncOperationsStore: Added operation')
    }

    private startTimer()
    {
        if (!this._disposed)
        {
            this._timerRunning = true
            this._timerInvalidated = false
            this._timerId = setTimeout(() => this.onTimer(), DEFAULT_TIMEOUT_MS)
            console.log('AsyncOperationsStore: Timer started')
        }
    }

    private async onTimer()
    {
        this._timerId = null
        console.log('AsyncOperationsStore: Handle timer')

        while (this._store.length > 0 && !this._timerInvalidated && !this._disposed)
        {
            const operation = this._store.shift()
            if (operation)
            {
                console.log('AsyncOperationsStore: Processing operation')
                await operation()
            }
        }

        if (this._store.length > 0) {
            this.startTimer()
        } 
        else
        {
            this._timerRunning = false
            this._onAllOperationsDone.fire()
            console.log('AsyncOperationsStore: All operations done')
        }
    }

    dispose()
    {
        this._disposed = true
        if (this._timerId)
        {
            clearTimeout(this._timerId)
        }
        console.log('AsyncOperationsStore: Disposed')
    }
}