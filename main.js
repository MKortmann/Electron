// Notation
// PascalCase -> Class and Type names (BrowserWindow, Session)
// camelCase -> Variable, Function, Method, Object Properties (app, mainWindow, loadUrl)

const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");
// app -> Module to control application life.
// BrowserWindow -> Module to create/manage native browser window.
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  shell,
  dialog,
} = require("electron/main");

const isDev = process.env.NODE_ENV !== "development";
console.log("test");
console.log("ipcMain available:", !!ipcMain);

let mainWindow;

const createMainWindow = () => {
  console.log("before main window 0");
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    width: isDev ? 1000 : 500,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  console.log("before main window");
  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
  console.log("after main window");
};

app
  .whenReady()
  .then(() => {
    createMainWindow();
    const customMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(customMenu);

    mainWindow.on("close", () => (mainWindow = null));

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((err) => {
    console.error("Error in app.whenReady:", err);
  });

const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    title: "About Image Resize",
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
};

const menu = [
  {
    label: "File",
    submenu: [
      {
        label: "Quit",
        click: () => app.quit(),
        accelerator: "CmdOrCtrl+W",
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About",
            click: createAboutWindow,
          },
        ],
      },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "About",
        click: createAboutWindow,
      },
    ],
  },
];

ipcMain.on("select:image", async (event) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "jpeg"] }],
      title: "Select an Image",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedFile = result.filePaths[0];
      console.log("Selected image:", selectedFile);
      event.sender.send("image:selected", selectedFile);
    }
  } catch (err) {
    console.error("Error selecting image:", err);
    event.sender.send("image:error", err.message);
  }
});

ipcMain.on("change:dir", async (e) => {
  console.log("Received change:dir event");
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Output Directory",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedDir = result.filePaths[0];
      console.log("Selected directory:", selectedDir);
      mainWindow.webContents.send("dir:changed", selectedDir);
    }
  } catch (err) {
    console.error("Error selecting directory:", err);
    mainWindow.webContents.send("dir:error", err.message);
  }
});

ipcMain.on("image:resize", (e, options) => {
  console.log("Received image:resize event with options:", options);
  if (!options.fileName || !options.fileData) {
    console.error("No file provided");
    return;
  }
  const imgPath = path.join(os.tmpdir(), options.fileName);
  fs.writeFileSync(imgPath, Buffer.from(options.fileData));
  console.log("Resolved imgPath:", imgPath);
  options.imgPath = imgPath;
  resizeImage(options);
});

async function resizeImage({ imgPath, width, height, outputPath }) {
  try {
    console.log("width: " + width);
    const image = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });

    // outputPath = options.outputPath || outputPath;
    const fileName = path.basename(imgPath);

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    fs.writeFileSync(path.join(outputPath, fileName), image);
    console.log("Image resized and saved to:", path.join(outputPath, fileName));

    mainWindow.webContents.send("image:done", {
      dest: outputPath,
      fileName,
    });
    shell.openPath(outputPath);
  } catch (err) {
    console.error("Error resizing image:", err);
    mainWindow.webContents.send("image:error", { error: err.message });
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
