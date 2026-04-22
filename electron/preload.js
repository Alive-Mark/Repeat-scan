/**
 * Electron 主进程
 * 提供桌面应用功能和 Node.js 文件系统访问
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow;
let tray;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false, // 先不显示，等加载完成后再显示
    titleBarStyle: 'default',
  });

  // 加载应用
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 窗口关闭时处理
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    } else {
      mainWindow = null;
    }
  });

  // 窗口关闭后清理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, '../public/tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示窗口', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    { 
      label: , 
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('重复文件扫描工具');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

// 所有窗口关闭时退出应用（Windows/Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理：选择文件夹
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择要扫描的文件夹',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const stats = await fs.stat(folderPath);
  
  return {
    path: folderPath,
    name: path.basename(folderPath),
    isDirectory: stats.isDirectory(),
  };
});

// IPC 处理：选择多个文件夹
ipcMain.handle('select-folders', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections'],
    title: '选择要扫描的文件夹（可多选）',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const folders = [];
  for (const folderPath of result.filePaths) {
    const stats = await fs.stat(folderPath);
    folders.push({
      path: folderPath,
      name: path.basename(folderPath),
      isDirectory: stats.isDirectory(),
    });
  }

  return folders;
});

// IPC 处理：扫描文件夹
ipcMain.handle('scan-folders', async (event, { folderPaths, config }) => {
  const allFiles = [];
  const emptyFolders = [];
  let scannedFiles = 0;
  let scannedFolders = 0;

  async function scanDirectory(dirPath, basePath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    scannedFolders++;

    // 检查是否为空文件夹
    if (config.modes && config.modes.includes('empty-folder')) {
      const hasVisibleEntries = entries.some(entry => {
        if (config.ignoreHidden && entry.name.startsWith('.')) return false;
        return true;
      });
      
      if (!hasVisibleEntries && dirPath !== basePath) {
        // 这是一个空文件夹
        const stats = await fs.stat(dirPath);
        emptyFolders.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: path.basename(dirPath),
          path: dirPath,
          modifiedTime: stats.mtime.getTime(),
        });
      }
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      // 跳过隐藏文件
      if (config.ignoreHidden && entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        // 递归扫描子目录
        await scanDirectory(fullPath, basePath);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.stat(fullPath);

          // 文件大小筛选
          if (config.minSize !== null && stats.size < config.minSize) continue;
          if (config.maxSize !== null && stats.size > config.maxSize) continue;

          // 文件类型筛选
          const ext = path.extname(entry.name).toLowerCase().slice(1);
          if (config.fileTypes.length > 0 && !config.fileTypes.includes(ext)) continue;

          // 计算文件哈希
          const fileBuffer = await fs.readFile(fullPath);
          const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

          allFiles.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            size: stats.size,
            modifiedTime: stats.mtime.getTime(),
            contentHash: hash,
            fileType: ext,
          });

          scannedFiles++;

          // 发送进度更新
          event.sender.send('scan-progress', {
            scannedFiles,
            currentFile: entry.name,
          });
        } catch (err) {
          // 跳过无法访问的文件
          console.error(`无法访问文件: ${fullPath}`, err);
        }
      }
    }
  }

  // 扫描所有选中的文件夹
  for (const folderPath of folderPaths) {
    await scanDirectory(folderPath, folderPath);
  }

  return { allFiles, emptyFolders };
});

// IPC 处理：删除文件
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理：批量删除文件
ipcMain.handle('delete-files', async (event, filePaths) => {
  const results = [];
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      results.push({ path: filePath, success: true });
    } catch (err) {
      results.push({ path: filePath, success: false, error: err.message });
    }
  }
  return results;
});

// IPC 处理：删除单个文件夹
ipcMain.handle('delete-folder', async (event, folderPath) => {
  try {
    await fs.rmdir(folderPath, { recursive: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理：批量删除文件夹
ipcMain.handle('delete-folders', async (event, folderPaths) => {
  const results = [];
  for (const folderPath of folderPaths) {
    try {
      await fs.rmdir(folderPath, { recursive: true });
      results.push({ path: folderPath, success: true });
    } catch (err) {
      results.push({ path: folderPath, success: false, error: err.message });
    }
  }
  return results;
});

// IPC 处理：移动文件
ipcMain.handle('move-file', async (event, { sourcePath, targetDir }) => {
  try {
    const fileName = path.basename(sourcePath);
    const targetPath = path.join(targetDir, fileName);
    await fs.rename(sourcePath, targetPath);
    return { success: true, newPath: targetPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理：选择目标文件夹（用于移动文件）
ipcMain.handle('select-target-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择目标文件夹',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

// IPC 处理：在资源管理器中显示文件
ipcMain.handle('show-in-folder', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

// IPC 处理：打开文件
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理：保存导出文件
ipcMain.handle('save-export-file', async (event, { content, defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [
      { name: '所有文件', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { success: false, canceled: true };
  }

  try {
    await fs.writeFile(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC 处理：获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// IPC 处理：获取平台信息
ipcMain.handle('get-platform', () => {
  return process.platform;
});
