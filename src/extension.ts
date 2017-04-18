import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

class LuaformatterEditsProvider implements
  vscode.DocumentFormattingEditProvider,
  vscode.DocumentRangeFormattingEditProvider {
  command: string;
  arguments: Array<string>;

  formatPandoc(text: string) {
    const config = vscode.workspace.getConfiguration('luaformatter');
    let cmd = config.get('path', 'luaformatter.path');

    if (process.platform == 'win32' && path.extname(cmd) != '.bat') {
      cmd += '.bat'
    }

    var editor = vscode.window.activeTextEditor;
    var fullName = path.normalize(editor.document.fileName);
    var filePath = path.dirname(fullName);
    var fileName = path.basename(fullName);
    var fileNameOnly = path.parse(fileName).name;

    var args = []
    let autosave = config.get('autosave', 'luaformatter.autosave');
    console.log(autosave)
    if (autosave[0]) {
      args.push('-a')
    }
    // spaces config
    args.push('-s' + config.get('spaces', 'luaformatter.spaces'))
    // tabs config
    args.push('-t' + config.get('tabs', 'luaformatter.tabs'))
    // delimiter config
    //args.push('-d' + config.get('delimiter', 'luaformatter.delimiter'))
    args.push(fullName)

    let result = child_process.spawnSync(cmd, args, { 'input': text });

    if (!result.status) {
      return result.stdout.toString();
    } else {
      vscode.window.showErrorMessage(result.stderr.toString());
      return text;
    }
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument, options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    vscode.TextEdit[] | Thenable<vscode.TextEdit[]> {
    let formatted = this.formatPandoc(document.getText());
    if (formatted != '')
      return [vscode.TextEdit.replace(
        /* TODO Find Range equivalent for [0, infinity] */
        new vscode.Range(0, 0, 1000, 1000), formatted)];
    else
      return [];
  }

  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument, range: vscode.Range,
    options: vscode.FormattingOptions, token: vscode.CancellationToken):
    vscode.TextEdit[] | Thenable<vscode.TextEdit[]> {
    let formatted = this.formatPandoc(document.getText(range));
    if (formatted != '')
      return [vscode.TextEdit.replace(range, formatted)];
    else
      return [];
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider(
    'lua', new LuaformatterEditsProvider);
  vscode.languages.registerDocumentRangeFormattingEditProvider(
    'lua', new LuaformatterEditsProvider);
}

export function deactivate() { }