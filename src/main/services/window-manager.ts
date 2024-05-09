import { BrowserWindow, Menu, Tray, app, screen } from "electron";
import { is } from "@electron-toolkit/utils";
import { t } from "i18next";
import path from "node:path";
import icon from "@resources/icon.png?asset";
import trayIcon from "@resources/tray-icon.png?asset";
import { userPreferencesRepository } from "@main/repository";

export class WindowManager {
  public static mainWindow: Electron.BrowserWindow | null = null;

  private static loadURL(hash = "") {
    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      this.mainWindow?.loadURL(
        `${process.env["ELECTRON_RENDERER_URL"]}#/${hash}`
      );
    } else {
      this.mainWindow?.loadFile(
        path.join(__dirname, "../renderer/index.html"),
        {
          hash,
        }
      );
    }
  }



  public static async createMainWindow() {
    //LOGIC FOR SCREEN RESOLUTION
    const userPreferences = await userPreferencesRepository.findOne({
      where: { id: 1 },
    });

    let width = Number(userPreferences?.resX);
    let height = Number(userPreferences?.resY);

    if (userPreferences?.fullscreenEnabled == true) {
       const primaryDisplay = screen.getPrimaryDisplay()
       const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
       width = screenWidth;
       height = screenHeight;
    }
    if (userPreferences?.fullscreenEnabled == false) {
      // width = 1200;
      // height = 720;
      if (!userPreferences?.resX || userPreferences.resX.trim() == '') {
         width = 1200; //default value in null cases
      }
      if (!userPreferences?.resY || userPreferences.resY.trim() == '') {
        height = 720; //default value in null cases
      }
      if (width < 1024){
         width = 1024;
      }
      if (height < 540){
        height = 540;
      }
    }
    //END LOGIC SCREEN RESOLUTION

    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width,
      height,
      minWidth: 1024,
      minHeight: 540,
      titleBarStyle: "hidden",
      ...(process.platform === "linux" ? { icon } : {}),
      trafficLightPosition: { x: 16, y: 16 },
      titleBarOverlay: {
        symbolColor: "#DADBE1",
        color: "#151515",
        height: 34,
      },
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.mjs"),
        sandbox: false,
      },
    });

    this.loadURL();
    this.mainWindow.removeMenu();

    this.mainWindow.on("close", () => {
      WindowManager.mainWindow?.setProgressBar(-1);
    });
  }

  public static redirect(hash: string) {
    if (!this.mainWindow) this.createMainWindow();
    this.loadURL(hash);

    if (this.mainWindow?.isMinimized()) this.mainWindow.restore();
    this.mainWindow?.focus();
  }

  public static createSystemTray(language: string) {
    const tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: t("open", {
          ns: "system_tray",
          lng: language,
        }),
        type: "normal",
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
          } else {
            this.createMainWindow();
          }
        },
      },
      {
        label: t("quit", {
          ns: "system_tray",
          lng: language,
        }),
        type: "normal",
        click: () => app.quit(),
      },
    ]);

    tray.setToolTip("Hydra");
    tray.setContextMenu(contextMenu);

    if (process.platform === "win32") {
      tray.addListener("click", () => {
        if (this.mainWindow) {
          if (WindowManager.mainWindow?.isMinimized())
            WindowManager.mainWindow.restore();

          WindowManager.mainWindow?.focus();
          return;
        }

        this.createMainWindow();
      });
    }
  }
}
