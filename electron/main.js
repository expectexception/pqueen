const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const http = require("http");
const net = require("net");
const { spawn } = require("child_process");

let mainWindow = null;
let serverProcess = null;
let activePort = 34567;
let serverUrl = `http://127.0.0.1:${activePort}`;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function findAvailablePort(startPort = 34567) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
    srv.listen(startPort, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function checkServerReady(url, maxRetries = 60, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on("error", () => {
        retry();
      });
      req.setTimeout(900, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server failed to start at ${url} within timeout.`));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

const SPLASH_HTML = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PQN Party Queen</title>
  <style>
    body {
      margin: 0;
      background: #0B0C10;
      color: #E2B86E;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      user-select: none;
    }
    .crown { font-size: 56px; margin-bottom: 16px; animation: pulse 2s infinite ease-in-out; }
    h1 { margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #fff; }
    p { margin: 12px 0 28px; font-size: 13px; letter-spacing: 2px; color: #a1a1aa; text-transform: uppercase; }
    .loader {
      width: 200px; height: 3px; background: rgba(226, 184, 110, 0.2); border-radius: 2px; overflow: hidden; position: relative;
    }
    .loader::after {
      content: ''; position: absolute; left: -50%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, #E2B86E, transparent);
      animation: slide 1.4s infinite ease-in-out;
    }
    @keyframes slide { 0% { left: -50%; } 100% { left: 100%; } }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.08); opacity: 1; } }
  </style>
</head>
<body>
  <div class="crown">👑</div>
  <h1>PQN PARTY QUEEN</h1>
  <p>Initializing Haute Couture Atelier...</p>
  <div class="loader"></div>
</body>
</html>
`)}`;

async function startNextServer() {
  activePort = await findAvailablePort(process.env.PORT ? parseInt(process.env.PORT, 10) : 34567);
  serverUrl = `http://127.0.0.1:${activePort}`;

  return new Promise((resolve, reject) => {
    const isPackaged = app.isPackaged;
    const projectRoot = isPackaged
      ? path.join(process.resourcesPath, "app")
      : path.resolve(__dirname, "..");

    const fs = require("fs");
    const candidates = [
      path.join(projectRoot, ".next", "standalone", "server.js"),
      path.join(projectRoot, "server.js"),
      path.join(__dirname, "..", ".next", "standalone", "server.js"),
    ];

    let serverScript = null;
    let serverCwd = null;

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        serverScript = cand;
        serverCwd = path.dirname(cand);
        break;
      }
    }

    if (!serverScript) {
      return reject(new Error(`Could not locate server.js. Checked:\n${candidates.join("\n")}`));
    }

    console.log(`[Electron] Launching Next.js server on port ${activePort}: ${serverScript}`);
    console.log(`[Electron] Server CWD: ${serverCwd}`);

    const serverEnv = {
      ...process.env,
      PORT: activePort.toString(),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      DESKTOP_MODE: "true",
    };

    // Ensure public static files are accessible by Next.js standalone
    const standaloneStatic = path.join(serverCwd, ".next", "static");
    const rootStatic = path.join(projectRoot, ".next", "static");
    if (!fs.existsSync(standaloneStatic) && fs.existsSync(rootStatic)) {
      try {
        fs.cpSync(rootStatic, standaloneStatic, { recursive: true });
      } catch (e) {
        console.warn("[Electron] Could not pre-copy static directory:", e.message);
      }
    }

    const standalonePublic = path.join(serverCwd, "public");
    const rootPublic = path.join(projectRoot, "public");
    if (!fs.existsSync(standalonePublic) && fs.existsSync(rootPublic)) {
      try {
        fs.cpSync(rootPublic, standalonePublic, { recursive: true });
      } catch (e) {
        console.warn("[Electron] Could not pre-copy public directory:", e.message);
      }
    }

    // Launch server using node
    serverProcess = spawn("node", [serverScript], {
      cwd: serverCwd,
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    serverProcess.stdout.on("data", (data) => {
      console.log(`[Server] ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Error] ${data}`);
    });

    serverProcess.on("exit", (code, signal) => {
      console.log(`[Server] Exited with code ${code}, signal ${signal}`);
    });

    checkServerReady(serverUrl)
      .then(resolve)
      .catch(reject);
  });
}

function createMainWindow() {
  const iconPath = path.join(__dirname, "..", "public", "icon.ico");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: "PQN PARTY QUEEN — Luxury Indian Couture & Atelier Management",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: "#0B0C10",
    show: true,
  });

  // Display initial luxury splash screen
  mainWindow.loadURL(SPLASH_HTML);

  // Build native application menu
  const menuTemplate = [
    {
      label: "👑 PQN Store",
      submenu: [
        {
          label: "Storefront Home",
          accelerator: "CmdOrCtrl+H",
          click: () => mainWindow.loadURL(serverUrl),
        },
        {
          label: "Browse Collections",
          accelerator: "CmdOrCtrl+B",
          click: () => mainWindow.loadURL(`${serverUrl}/shop`),
        },
        {
          label: "Shopping Bag",
          click: () => mainWindow.loadURL(`${serverUrl}/cart`),
        },
        { type: "separator" },
        {
          label: "Exit Software",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "💼 Admin Suite",
      submenu: [
        {
          label: "Admin Dashboard",
          accelerator: "CmdOrCtrl+A",
          click: () => mainWindow.loadURL(`${serverUrl}/admin`),
        },
        {
          label: "Orders & Fulfillment",
          accelerator: "CmdOrCtrl+O",
          click: () => mainWindow.loadURL(`${serverUrl}/admin/orders`),
        },
        {
          label: "Products & Inventory",
          accelerator: "CmdOrCtrl+P",
          click: () => mainWindow.loadURL(`${serverUrl}/admin/products`),
        },
        {
          label: "Analytics & Sales Reports",
          click: () => mainWindow.loadURL(`${serverUrl}/admin/analytics`),
        },
        {
          label: "Store Settings & Logistics",
          click: () => mainWindow.loadURL(`${serverUrl}/admin/settings`),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", accelerator: "CmdOrCtrl+R" },
        { role: "forceReload", accelerator: "CmdOrCtrl+Shift+R" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn", accelerator: "CmdOrCtrl+=" },
        { role: "zoomOut", accelerator: "CmdOrCtrl+-" },
        { type: "separator" },
        { role: "togglefullscreen", accelerator: "F11" },
        { role: "toggleDevTools", accelerator: "F12" },
      ],
    },
    {
      label: "Help & Credentials",
      submenu: [
        {
          label: "View Default Credentials",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "PQN Party Queen - Default Credentials",
              message: "Default Pre-loaded Credentials",
              detail: 
                "👑 Super Admin:\n" +
                "Email: admin@pqnpartyqueen.com\n" +
                "Password: Admin@12345\n\n" +
                "👗 Store Manager:\n" +
                "Email: manager@pqnpartyqueen.com\n" +
                "Password: Manager@12345\n\n" +
                "🛍️ Demo Customer:\n" +
                "Email: customer@pqnpartyqueen.com\n" +
                "Password: Customer@12345\n\n" +
                "Local Server URL: " + serverUrl,
            });
          },
        },
        {
          label: "Open Online Atelier",
          click: () => shell.openExternal("https://pqnpartyqueen.com"),
        },
        {
          label: "About PQN Desktop Software",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About PQN Party Queen Desktop",
              message: "PQN PARTY QUEEN — Windows Desktop Edition",
              detail: "Version: 1.0.0\nArchitecture: Standalone Full-Stack Next.js 16 + Electron Desktop\nHaute Couture & Luxury Indian Fashion",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      if (!url.includes(`127.0.0.1:${activePort}`) && !url.includes(`localhost:${activePort}`)) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopServer() {
  if (serverProcess) {
    console.log("[Electron] Terminating background Next.js server...");
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", serverProcess.pid.toString(), "/f", "/t"]);
      } else {
        serverProcess.kill("SIGTERM");
      }
    } catch (e) {
      console.warn("[Electron] Error terminating server process:", e.message);
    }
    serverProcess = null;
  }
}

app.whenReady().then(async () => {
  createMainWindow();

  try {
    console.log("[Electron] Starting local Next.js background server...");
    await startNextServer();
    console.log(`[Electron] Server is running at ${serverUrl}. Navigating main window...`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(serverUrl);
    }
  } catch (err) {
    console.error("[Electron] Fatal startup error:", err);
    dialog.showErrorBox(
      "PQN Party Queen Launch Error",
      `Failed to initialize local application server:\n\n${err.message}`
    );
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer();
});

app.on("will-quit", () => {
  stopServer();
});
