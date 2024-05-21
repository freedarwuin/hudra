import { stateManager } from "./state-manager";
import { repackersOn1337x, seedsPath } from "./constants";
import {
  getNewGOGGames,
  getNewRepacksFromUser,
  getNewRepacksFromXatab,
  getNewRepacksFromOnlineFix,
  startProcessWatcher,
  DownloadManager,
} from "./services";
import {
  gameRepository,
  repackRepository,
  userPreferencesRepository,
} from "./repository";
import { TorrentDownloader } from "./services";
import { Repack, UserPreferences } from "./entity";
import { Notification } from "electron";
import { t } from "i18next";
import { GameStatus } from "@shared";
import { In } from "typeorm";
import fs from "node:fs";
import path from "node:path";
import { RealDebridClient } from "./services/real-debrid";
import { orderBy } from "lodash-es";
import { SteamGame } from "@types";
import { loadThemesPath } from "./theme/path";

startProcessWatcher();
loadThemesPath();

const track1337xUsers = async (existingRepacks: Repack[]) => {
  for (const repacker of repackersOn1337x) {
    await getNewRepacksFromUser(
      repacker,
      existingRepacks.filter((repack) => repack.repacker === repacker)
    );
  }
};

const checkForNewRepacks = async (userPreferences: UserPreferences | null) => {
  const existingRepacks = stateManager.getValue("repacks");

  Promise.allSettled([
    track1337xUsers(existingRepacks),
    getNewRepacksFromXatab(
      existingRepacks.filter((repack) => repack.repacker === "Xatab")
    ),
    getNewGOGGames(
      existingRepacks.filter((repack) => repack.repacker === "GOG")
    ),
    getNewRepacksFromOnlineFix(
      existingRepacks.filter((repack) => repack.repacker === "onlinefix")
    ),
  ]).then(() => {
    repackRepository.count().then((count) => {
      const total = count - stateManager.getValue("repacks").length;

      if (total > 0 && userPreferences?.repackUpdatesNotificationsEnabled) {
        new Notification({
          title: t("repack_list_updated", {
            ns: "notifications",
            lng: userPreferences?.language || "en",
          }),
          body: t("repack_count", {
            ns: "notifications",
            lng: userPreferences?.language || "en",
            count: total,
          }),
        }).show();
      }
    });
  });
};

const loadState = async (userPreferences: UserPreferences | null) => {
  const repacks = await repackRepository.find({
    order: {
      createdAt: "desc",
    },
  });

  const steamGames = JSON.parse(
    fs.readFileSync(path.join(seedsPath, "steam-games.json"), "utf-8")
  ) as SteamGame[];

  stateManager.setValue("repacks", repacks);
  stateManager.setValue("steamGames", orderBy(steamGames, ["name"], "asc"));

  import("./events");

  if (userPreferences?.realDebridApiToken)
    await RealDebridClient.authorize(userPreferences?.realDebridApiToken);

  const game = await gameRepository.findOne({
    where: {
      status: In([
        GameStatus.Downloading,
        GameStatus.DownloadingMetadata,
        GameStatus.CheckingFiles,
      ]),
      isDeleted: false,
    },
    relations: { repack: true },
  });

  await TorrentDownloader.startClient();

  if (game) {
    DownloadManager.resumeDownload(game.id);
  }
};

userPreferencesRepository
  .findOne({
    where: { id: 1 },
  })
  .then((userPreferences) => {
    loadState(userPreferences).then(() => checkForNewRepacks(userPreferences));
  });
