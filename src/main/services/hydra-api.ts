import { userAuthRepository } from "@main/repository";
import axios, { AxiosError, AxiosInstance } from "axios";
import { WindowManager } from "./window-manager";
import url from "url";
import { uploadGamesBatch } from "./library-sync";
import { clearGamesRemoteIds } from "./library-sync/clear-games-remote-id";
import { logger } from "./logger";

export class HydraApi {
  private static instance: AxiosInstance;

  private static readonly EXPIRATION_OFFSET_IN_MS = 1000 * 60 * 5;

  private static secondsToMilliseconds = (seconds: number) => seconds * 1000;

  private static userAuth = {
    authToken: "",
    refreshToken: "",
    expirationTimestamp: 0,
  };

  static isLoggedIn() {
    return this.userAuth.authToken !== "";
  }

  static async handleExternalAuth(uri: string) {
    const { payload } = url.parse(uri, true).query;

    const decodedBase64 = atob(payload as string);
    const jsonData = JSON.parse(decodedBase64);

    const { accessToken, expiresIn, refreshToken } = jsonData;

    const now = new Date();

    const tokenExpirationTimestamp =
      now.getTime() +
      this.secondsToMilliseconds(expiresIn) -
      this.EXPIRATION_OFFSET_IN_MS;

    this.userAuth = {
      authToken: accessToken,
      refreshToken: refreshToken,
      expirationTimestamp: tokenExpirationTimestamp,
    };

    await userAuthRepository.upsert(
      {
        id: 1,
        accessToken,
        tokenExpirationTimestamp,
        refreshToken,
      },
      ["id"]
    );

    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send("on-signin");
      await clearGamesRemoteIds();
      uploadGamesBatch();
    }
  }

  static async setupApi() {
    this.instance = axios.create({
      baseURL: import.meta.env.MAIN_VITE_API_URL,
    });

    this.instance.interceptors.request.use(
      (request) => {
        logger.log(" ---- REQUEST -----");
        logger.log(request.method, request.url, request.data);
        return request;
      },
      (error) => {
        logger.log("request error", error);
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response) => {
        logger.log(" ---- RESPONSE -----");
        logger.log(
          response.status,
          response.config.method,
          response.config.url,
          response.data
        );
        return response;
      },
      (error) => {
        logger.error("response error", error);
        return Promise.reject(error);
      }
    );

    const userAuth = await userAuthRepository.findOne({
      where: { id: 1 },
    });

    this.userAuth = {
      authToken: userAuth?.accessToken ?? "",
      refreshToken: userAuth?.refreshToken ?? "",
      expirationTimestamp: userAuth?.tokenExpirationTimestamp ?? 0,
    };
  }

  private static async revalidateAccessTokenIfExpired() {
    if (!this.userAuth.authToken) {
      userAuthRepository.delete({ id: 1 });
      logger.error("user is not logged in");
      throw new Error("user is not logged in");
    }

    const now = new Date();
    if (this.userAuth.expirationTimestamp < now.getTime()) {
      try {
        const response = await this.instance.post(`/auth/refresh`, {
          refreshToken: this.userAuth.refreshToken,
        });

        const { accessToken, expiresIn } = response.data;

        const tokenExpirationTimestamp =
          now.getTime() +
          this.secondsToMilliseconds(expiresIn) -
          this.EXPIRATION_OFFSET_IN_MS;

        this.userAuth.authToken = accessToken;
        this.userAuth.expirationTimestamp = tokenExpirationTimestamp;

        userAuthRepository.upsert(
          {
            id: 1,
            accessToken,
            tokenExpirationTimestamp,
          },
          ["id"]
        );
      } catch (err) {
        if (
          err instanceof AxiosError &&
          (err?.response?.status === 401 || err?.response?.status === 403)
        ) {
          this.userAuth = {
            authToken: "",
            expirationTimestamp: 0,
            refreshToken: "",
          };

          userAuthRepository.delete({ id: 1 });

          if (WindowManager.mainWindow) {
            WindowManager.mainWindow.webContents.send("on-signout");
          }

          logger.log("user refresh token expired");
        }

        throw err;
      }
    }
  }

  private static getAxiosConfig() {
    return {
      headers: {
        Authorization: `Bearer ${this.userAuth.authToken}`,
      },
    };
  }

  static async get(url: string) {
    await this.revalidateAccessTokenIfExpired();
    return this.instance.get(url, this.getAxiosConfig());
  }

  static async post(url: string, data?: any) {
    await this.revalidateAccessTokenIfExpired();
    return this.instance.post(url, data, this.getAxiosConfig());
  }

  static async put(url: string, data?: any) {
    await this.revalidateAccessTokenIfExpired();
    return this.instance.put(url, data, this.getAxiosConfig());
  }

  static async patch(url: string, data?: any) {
    await this.revalidateAccessTokenIfExpired();
    return this.instance.patch(url, data, this.getAxiosConfig());
  }

  static async delete(url: string) {
    await this.revalidateAccessTokenIfExpired();
    return this.instance.delete(url, this.getAxiosConfig());
  }
}
