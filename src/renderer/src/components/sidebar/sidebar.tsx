import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { Game } from "@types";

import { TextField } from "@renderer/components";
import { useDownload, useLibrary } from "@renderer/hooks";

import { routes } from "./routes";


import { DeleteModal } from "./delete-modal";
import * as styles from "./sidebar.css";

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_INITIAL_WIDTH = 250;
const SIDEBAR_MAX_WIDTH = 450;

const initialSidebarWidth = window.localStorage.getItem("sidebarWidth");

export function Sidebar() {
  const { t } = useTranslation("sidebar");
  const { library, updateLibrary } = useLibrary();
  const navigate = useNavigate();

  const [filteredLibrary, setFilteredLibrary] = useState<Game[]>([]);

  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(
    initialSidebarWidth ? Number(initialSidebarWidth) : SIDEBAR_INITIAL_WIDTH
  );

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [axisCoordinates, setAxisCoordinates] = useState({
    x: 0,
    y: 0,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game>();

  const location = useLocation();

  const { game: gameDownloading, progress } = useDownload();

  const isDownloading = library.some((game) =>
    GameStatusHelper.isDownloading(game.status)
  );

  const sidebarRef = useRef<HTMLElement>(null);

  const cursorPos = useRef({ x: 0 });
  const sidebarInitialWidth = useRef(0);

  const selectGameExecutable = async () => {
    const { filePaths } = await window.electron.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: t("game_executable"),
          extensions: window.electron.platform === "win32" ? ["exe"] : [],
        },
      ],
    });

    if (filePaths && filePaths.length > 0) {
      return filePaths[0];
    }

    return null;
  };

  const updateExePath = async () => {
    try {
      const gameExecutablePath = await selectGameExecutable();
      if (gameExecutablePath) {
        await window.electron.changeExecutablePath(
          currentGame?.id ?? 0,
          gameExecutablePath
        );

        await window.electron.openGame(
          currentGame?.id ?? 0,
          gameExecutablePath
        );

        updateLibrary();
      }
    } catch (error) {
      console.error("Error updating game executable path: ", error);
    }
  };

  const openGameFolder = () =>
    window.electron.openGameFolder(currentGame?.id ?? 0).then(() => {
      updateLibrary();
    });

  const handleMouseDown: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    setIsResizing(true);
    cursorPos.current.x = event.screenX;
    sidebarInitialWidth.current =
      sidebarRef.current?.clientWidth || SIDEBAR_INITIAL_WIDTH;
  };

  const handleFilter: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setFilteredLibrary(
      library.filter((game) =>
        game.title
          .toLowerCase()
          .includes(event.target.value.toLocaleLowerCase())
      )
    );
  };

  const handleOpenDeleteGameModal = async () => {
    setShowDeleteModal(true);
    setIsContextMenuOpen(false);
  };

  const getGameTitle = (game: Game) => {
    if (game.status === "paused") return t("paused", { title: game.title });

    if (gameDownloading?.id === game.id) {
      const isVerifying = ["downloading_metadata", "checking_files"].includes(
        gameDownloading?.status
      );

      if (isVerifying)
        return t(gameDownloading.status, {
          title: game.title,
          percentage: progress,
        });

      return t("downloading", {
        title: game.title,
        percentage: progress,
      });
    }

    return game.title;
  };

  const handleSidebarItemClick = (path: string) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  useEffect(() => {
    updateLibrary();
  }, [gameDownloading?.id, updateLibrary]);

  useEffect(() => {
    setFilteredLibrary(library);
  }, [library]);

  useEffect(() => {
    window.onmousemove = (event: MouseEvent) => {
      if (isResizing) {
        const cursorXDelta = event.screenX - cursorPos.current.x;
        const newWidth = Math.max(
          SIDEBAR_MIN_WIDTH,
          Math.min(
            sidebarInitialWidth.current + cursorXDelta,
            SIDEBAR_MAX_WIDTH
          )
        );

        setSidebarWidth(newWidth);
        window.localStorage.setItem("sidebarWidth", String(newWidth));
      }
    };

    window.onmouseup = () => {
      if (isResizing) setIsResizing(false);
    };

    return () => {
      window.onmouseup = null;
      window.onmousemove = null;
    };
  }, [isResizing]);

  useEffect(() => {
    // closes context menu if click out of focus
    const handleClick = () => setIsContextMenuOpen(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);
  const getGameTitle = (game: Game) => {
    if (game.status === GameStatus.Paused)
      return t("paused", { title: game.title });

    if (gameDownloading?.id === game.id) {
      const isVerifying = GameStatusHelper.isVerifying(gameDownloading.status);

      if (isVerifying)
        return t(gameDownloading.status!, {
          title: game.title,
          percentage: progress,
        });

      return t("downloading", {
        title: game.title,
        percentage: progress,
      });
    }

    return game.title;
  };

  const handleSidebarItemClick = (path: string) => {
    if (path !== location.pathname) {
      navigate(path);
    }
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={styles.sidebar({ resizing: isResizing })}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
        }}
      >
        <div
          className={styles.content({
            macos: window.electron.platform === "darwin",
          })}
        >
          {window.electron.platform === "darwin" && <h2>Hydra</h2>}

          <section className={styles.section}>
            <ul className={styles.menu}>
              {routes.map(({ nameKey, path, render }) => (
                <li
                  key={nameKey}
                  className={styles.menuItem({
                    active: location.pathname === path,
                  })}
                >
                  <button
                    type="button"
                    className={styles.menuItemButton}
                    onClick={() => handleSidebarItemClick(path)}
                  >
                    {render(isDownloading)}
                    <span>{t(nameKey)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <small className={styles.sectionTitle}>{t("my_library")}</small>

            <TextField
              placeholder={t("filter")}
              onChange={handleFilter}
              theme="dark"
            />

            <ul className={styles.menu}>
              {filteredLibrary.map((game) => {
                return (
                  <Fragment key={game.id}>
                    <li
                      key={game.id}
                      className={styles.menuItem({
                        active:
                          location.pathname ===
                          `/game/${game.shop}/${game.objectID}`,
                        muted: game.status === "cancelled",
                      })}
                      onContextMenu={(e) => {
                        setIsContextMenuOpen(true);
                        setCurrentGame(game);
                        setAxisCoordinates({
                          x: e.pageX,
                          y: e.pageY,
                        });
                      }}
                    >
                      <button
                        type="button"
                        className={styles.menuItemButton}
                        onClick={() =>
                          handleSidebarItemClick(
                            `/game/${game.shop}/${game.objectID}`
                          )
                        }
                      >
                        <img
                          className={styles.gameIcon}
                          src={game.iconUrl}
                          alt={game.title}
                        />
                        <span className={styles.menuItemButtonLabel}>
                          {getGameTitle(game)}
                        </span>
                      </button>
                    </li>

                    {isContextMenuOpen && (
                      <div
                        className={styles.contextMenu}
                        style={{
                          top: axisCoordinates.y - 15,
                          left: axisCoordinates.x,
                        }}
                      >
                        <menu className={styles.contextMenuList}>
                          <button
                            onClick={() => {
                              openGameFolder();
                              setIsContextMenuOpen(false);
                            }}
                            className={styles.contextMenuListItem}
                            disabled={
                              currentGame?.downloadPath === null ||
                              currentGame?.folderName === null
                            }
                          >
                            <FileDirectoryIcon
                              className={styles.contextMenuItemIcon}
                            />
                            <span>{t("open_archive_path")}</span>
                          </button>

                          <button
                            className={styles.contextMenuListItem}
                            onClick={async () => {
                              // TO-DO: add toast or desktop notification
                              await updateExePath();
                              setIsContextMenuOpen(false);
                            }}
                            disabled={
                              currentGame?.downloadPath === null ||
                              currentGame?.folderName === null
                            }
                          >
                            <FileDirectorySymlinkIcon
                              className={styles.contextMenuItemIcon}
                            />
                            <span>{t("change_exe_path")}</span>
                          </button>

                          <button
                            className={styles.contextMenuListItem}
                            onClick={() => {
                              // TO-DO: add toast or desktop notification
                              handleOpenDeleteGameModal();
                            }}
                            disabled={
                              currentGame?.downloadPath === null ||
                              currentGame?.folderName === null
                            }
                          >
                            <TrashIcon className={styles.contextMenuItemIcon} />
                            <span>{t("delete_installation_files")}</span>
                          </button>
                        </menu>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </ul>

            <DeleteModal
              visible={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              gameId={currentGame?.id ?? 0}
            />
          </section>
        </div>
          <ul className={styles.menu}>
            {filteredLibrary.map((game) => (
              <li
                key={game.id}
                className={styles.menuItem({
                  active:
                    location.pathname === `/game/${game.shop}/${game.objectID}`,
                  muted: game.status === GameStatus.Cancelled,
                })}
              >
                <button
                  type="button"
                  className={styles.menuItemButton}
                  onClick={() =>
                    handleSidebarItemClick(buildGameDetailsPath(game))
                  }
                >
                  {game.iconUrl ? (
                    <img
                      className={styles.gameIcon}
                      src={game.iconUrl}
                      alt={game.title}
                    />
                  ) : (
                    <SteamLogo className={styles.gameIcon} />
                  )}

                  <span className={styles.menuItemButtonLabel}>
                    {getGameTitle(game)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

        <button
          type="button"
          className={styles.handle}
          onMouseDown={handleMouseDown}
        />

        <footer className={styles.sidebarFooter}>
          <div className={styles.footerText}>{t("follow_us")}</div>

          <span className={styles.footerSocialsContainer}>
            {socials.map((item) => {
              return (
                <button
                  key={item.url}
                  className={styles.footerSocialsItem}
                  onClick={() => window.electron.openExternal(item.url)}
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.icon}
                </button>
              );
            })}
          </span>
        </footer>
      </aside>
    </>
      <button
        type="button"
        className={styles.handle}
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
