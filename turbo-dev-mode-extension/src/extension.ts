import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TurboSettings {
  // Performance & Startup
  'workbench.startupEditor': string;
  'workbench.editor.enablePreview': boolean;
  'editor.minimap.enabled': boolean;
  'editor.cursorSmoothCaretAnimation': string;
  'editor.smoothScrolling': boolean;
  'editor.inlineSuggest.enabled': boolean;
  
  // Formatage automatique
  'editor.formatOnSave': boolean;
  'editor.formatOnPaste': boolean;
  'editor.formatOnType': boolean;
  'editor.defaultFormatter': string;
  'editor.codeActionsOnSave': Record<string, string>;
  
  // GitHub Copilot
  'github.copilot.inlineSuggest.enable': boolean;
  'github.copilot.enable': Record<string, boolean>;
  
  // TypeScript performance
  'typescript.tsserver.log': string;
  'typescript.tsserver.experimental.enableProjectDiagnostics': boolean;
  'typescript.preferences.importModuleSpecifier': string;
  
  // ESLint optimisé
  'eslint.validate': string[];
  'eslint.format.enable': boolean;
  'eslint.run': string;
  
  // Autres optimisations
  'prettier.requireConfig': boolean;
  'explorer.confirmDelete': boolean;
  'explorer.confirmDragAndDrop': boolean;
  'files.exclude': Record<string, boolean>;
  'editor.accessibilitySupport': string;
}

const TURBO_SETTINGS: TurboSettings = {
  // Performance & Startup
  'workbench.startupEditor': 'none',
  'workbench.editor.enablePreview': false,
  'editor.minimap.enabled': false,
  'editor.cursorSmoothCaretAnimation': 'on',
  'editor.smoothScrolling': true,
  'editor.inlineSuggest.enabled': true,
  
  // Formatage automatique
  'editor.formatOnSave': true,
  'editor.formatOnPaste': false,
  'editor.formatOnType': false,
  'editor.defaultFormatter': 'esbenp.prettier-vscode',
  'editor.codeActionsOnSave': {
    'source.fixAll': 'explicit',
    'source.organizeImports': 'explicit',
    'source.fixAll.eslint': 'explicit'
  },
  
  // GitHub Copilot optimisé
  'github.copilot.inlineSuggest.enable': true,
  'github.copilot.enable': {
    '*': true,
    'markdown': false,
    'plaintext': false
  },
  
  // TypeScript performance
  'typescript.tsserver.log': 'off',
  'typescript.tsserver.experimental.enableProjectDiagnostics': false,
  'typescript.preferences.importModuleSpecifier': 'relative',
  
  // ESLint optimisé
  'eslint.validate': ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'],
  'eslint.format.enable': true,
  'eslint.run': 'onSave',
  
  // Autres optimisations
  'prettier.requireConfig': true,
  'explorer.confirmDelete': false,
  'explorer.confirmDragAndDrop': false,
  'files.exclude': {
    '**/.git': true,
    '**/.DS_Store': true,
    '**/node_modules': true,
    '**/dist': true,
    '**/.vite': true
  },
  'editor.accessibilitySupport': 'off'
};

const REQUIRED_EXTENSIONS = [
  'esbenp.prettier-vscode',
  'dbaeumer.vscode-eslint',
  'github.copilot',
  'bradlc.vscode-tailwindcss',
  'usernamehw.errorlens',
  'christian-kohler.path-intellisense',
  'wix.vscode-import-cost',
  'eamodio.gitlens'
];

export function activate(context: vscode.ExtensionContext) {
  console.log('🚀 MyConfort Turbo Dev Mode - Activation');

  // Commande d'activation manuelle
  const activateCommand = vscode.commands.registerCommand('myconfort-turbo.activate', async () => {
    await activateTurboMode();
  });

  // Commande de désactivation
  const deactivateCommand = vscode.commands.registerCommand('myconfort-turbo.deactivate', async () => {
    await deactivateTurboMode();
  });

  // Commande de statut
  const statusCommand = vscode.commands.registerCommand('myconfort-turbo.status', async () => {
    await showTurboStatus();
  });

  context.subscriptions.push(activateCommand, deactivateCommand, statusCommand);

  // Auto-activation si configurée
  const config = vscode.workspace.getConfiguration('myconfort-turbo');
  if (config.get('autoActivate', true)) {
    setTimeout(() => {
      checkAndActivateTurboMode();
    }, 2000); // Délai pour laisser VS Code se charger
  }
}

async function checkAndActivateTurboMode() {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const isReactViteProject = await detectReactViteProject(workspaceFolder.uri.fsPath);

  if (isReactViteProject) {
    const config = vscode.workspace.getConfiguration('myconfort-turbo');
    if (config.get('showNotifications', true)) {
      const choice = await vscode.window.showInformationMessage(
        '🚀 Projet React/Vite détecté ! Activer Turbo Mode MyConfort ?',
        'Activer',
        'Plus tard',
        'Ne plus demander'
      );

      if (choice === 'Activer') {
        await activateTurboMode();
      } else if (choice === 'Ne plus demander') {
        await config.update('autoActivate', false, vscode.ConfigurationTarget.Global);
      }
    }
  }
}

async function detectReactViteProject(workspacePath: string): Promise<boolean> {
  const packageJsonPath = path.join(workspacePath, 'package.json');
  const viteConfigPath = path.join(workspacePath, 'vite.config.ts');
  const viteConfigJsPath = path.join(workspacePath, 'vite.config.js');

  // Vérifier vite.config
  if (fs.existsSync(viteConfigPath) || fs.existsSync(viteConfigJsPath)) {
    return true;
  }

  // Vérifier package.json
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      return !!(deps.react && deps.vite);
    } catch (error) {
      console.error('Erreur lecture package.json:', error);
    }
  }

  return false;
}

async function activateTurboMode() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage('❌ Aucun workspace ouvert');
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const vscodeFolder = path.join(workspaceFolder.uri.fsPath, '.vscode');
  const settingsPath = path.join(vscodeFolder, 'settings.json');

  try {
    // Créer le dossier .vscode si nécessaire
    if (!fs.existsSync(vscodeFolder)) {
      fs.mkdirSync(vscodeFolder, { recursive: true });
    }

    // Lire les settings existants ou créer un objet vide
    let existingSettings = {};
    if (fs.existsSync(settingsPath)) {
      const content = fs.readFileSync(settingsPath, 'utf8');
      try {
        existingSettings = JSON.parse(content);
      } catch (error) {
        console.warn('Settings.json invalide, création d\'un nouveau fichier');
      }
    }

    // Fusionner avec les settings turbo
    const mergedSettings = {
      ...existingSettings,
      ...TURBO_SETTINGS,
      '// MyConfort Turbo Mode': '⚡ Configuration optimisée pour React/Vite/TypeScript'
    };

    // Écrire les nouveaux settings
    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));

    // Installer les extensions si configuré
    const config = vscode.workspace.getConfiguration('myconfort-turbo');
    if (config.get('autoInstallExtensions', true)) {
      await installRequiredExtensions();
    }

    // Créer .prettierrc si absent
    await createPrettierConfig(workspaceFolder.uri.fsPath);

    // Notification de succès
    if (config.get('showNotifications', true)) {
      vscode.window.showInformationMessage(
        '🚀 Turbo Mode MyConfort activé ! Performance maximale.',
        'Voir guide'
      ).then(choice => {
        if (choice === 'Voir guide') {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(
            path.join(workspaceFolder.uri.fsPath, 'VSCODE-TURBO-GUIDE.md')
          ));
        }
      });
    }

  } catch (error) {
    vscode.window.showErrorMessage(`❌ Erreur activation Turbo Mode: ${error}`);
  }
}

async function installRequiredExtensions() {
  const installedExtensions = vscode.extensions.all.map(ext => ext.id.toLowerCase());
  
  for (const extensionId of REQUIRED_EXTENSIONS) {
    if (!installedExtensions.includes(extensionId.toLowerCase())) {
      try {
        await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
        console.log(`✅ Extension installée: ${extensionId}`);
      } catch (error) {
        console.warn(`⚠️ Impossible d'installer ${extensionId}:`, error);
      }
    }
  }
}

async function createPrettierConfig(workspacePath: string) {
  const prettierPath = path.join(workspacePath, '.prettierrc');
  
  if (!fs.existsSync(prettierPath)) {
    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      bracketSpacing: true,
      bracketSameLine: false,
      arrowParens: 'avoid',
      endOfLine: 'lf'
    };

    fs.writeFileSync(prettierPath, JSON.stringify(prettierConfig, null, 2));
  }
}

async function deactivateTurboMode() {
  vscode.window.showInformationMessage('⏸️ Turbo Mode désactivé. Redémarrez VS Code pour appliquer.');
}

async function showTurboStatus() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showInformationMessage('❌ Aucun workspace ouvert');
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const settingsPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'settings.json');
  
  const isActive = fs.existsSync(settingsPath);
  const isReactVite = await detectReactViteProject(workspaceFolder.uri.fsPath);

  const status = [
    `📊 **Statut Turbo Mode MyConfort**`,
    ``,
    `🎯 Projet: ${isReactVite ? '✅ React/Vite détecté' : '❌ Non React/Vite'}`,
    `⚡ Turbo Mode: ${isActive ? '✅ Actif' : '❌ Inactif'}`,
    `📁 Workspace: ${workspaceFolder.name}`,
    ``,
    `🚀 Pour activer: Cmd+Shift+P → "MyConfort: Activer Turbo Mode"`
  ].join('\\n');

  vscode.window.showInformationMessage(status);
}

export function deactivate() {
  console.log('🛑 MyConfort Turbo Dev Mode - Désactivation');
}
