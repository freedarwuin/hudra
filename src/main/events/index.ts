import { app, ipcMain } from "electron";
import { defaultDownloadsPath } from "@main/constants";

import "./library/add-game-to-library";
import "./catalogue/search-games";
import "./catalogue/get-game-shop-details";
import "./catalogue/get-catalogue";
import "./library/get-library";
import "./hardware/get-disk-free-space";
import "./torrenting/cancel-game-download";
import "./torrenting/pause-game-download";
import "./torrenting/resume-game-download";
import "./torrenting/start-game-download";
import "./misc/get-or-cache-image";
import "./user-preferences/update-user-preferences";
import "./user-preferences/get-user-preferences";
import "./library/get-repackers-friendly-names";
import "./library/get-game-by-object-id";
import "./library/open-game";
import "./misc/show-open-dialog";
import "./library/remove-game";
import "./library/delete-game-folder";
import "./catalogue/get-random-game";
import "./catalogue/get-how-long-to-beat";

ipcMain.handle("ping", () => "pong");
ipcMain.handle("getVersion", () => app.getVersion());
ipcMain.handle("getDefaultDownloadsPath", () => defaultDownloadsPath);
