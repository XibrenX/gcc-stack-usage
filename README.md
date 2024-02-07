# Gcc stack usage
Compile your code with `-fstack-usage`, after that run the `reload su files` command in vscode.

# Known issues
Here are some known issues and workarounds.

## Duplicate filenames
Gcc does not output the full file path, only filenames. So if your workspace contains multiple files with the same filename, the extension might show information for other same named files there as well...

## Stack usage for files in .gitignore
VSCode by default does not allow searching for files that are listed as ignored. But these files my have stack usage information. When pressing on an item in the global stack usage view, that refers to a ignored file, VSCode is not likely to redirect you to the file. Instead the filename, row and column information is shown, and you should open the file manualy. While the file is open, VSCode is able to find it, so when pressing again you should be redirected correctly.