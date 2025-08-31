import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const turboConfig = {
  "workbench.startupEditor": "none",
  "workbench.editor.enablePreview": false,
  "editor.minimap.enabled": false,
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.smoothScrolling": true,
  "editor.inlineSuggest.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.organizeImports": "explicit"
  },
  "github.copilot.inlineSuggest.enable": true,
  "github.copilot.enable": {
    "*": true,
    "markdown": false,
    "plaintext": false
  },
  "typescript.tsserver.log": "off",
  "typescript.tsserver.experimental.enableProjectDiagnostics": false,
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.format.enable": true,
  "eslint.run": "onSave",
  "prettier.requireConfig": true,
  "explorer.confirmDelete": false,
  "explorer.confirmDragAndDrop": false,
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.vite": true
  },
  "vite.enableProjectAutoDetection": true,
  "vite.autoStart": false,
  "editor.accessibilitySupport": "off",
  "editor.suggest.snippetsPreventQuickSuggestions": false,
  "editor.suggest.localityBonus": true,
  "editor.parameterHints.enabled": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "typescriptreact": "typescriptreact"
  }
};

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('turboMode.activate', () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Aucun workspace ouvert !');
      return;
    }

    const vscodePath = path.join(workspaceFolder.uri.fsPath, '.vscode');
    const settingsPath = path.join(vscodePath, 'settings.json');

    // Créer le dossier .vscode s'il n'existe pas
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath);
    }

    // Sauvegarder la config existante
    if (fs.existsSync(settingsPath)) {
      const backupPath = path.join(vscodePath, 'settings.json.backup');
      fs.copyFileSync(settingsPath, backupPath);
    }

    // Écrire la nouvelle config
    fs.writeFileSync(settingsPath, JSON.stringify(turboConfig, null, 2));

    vscode.window.showInformationMessage('🚀 Turbo Mode MyConfort activé pour ce projet !');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
