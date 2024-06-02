import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Repack } from "./repack.entity";

import type { GameShop } from "@types";
import { Downloader } from "@shared";
import type { Aria2Status } from "aria2";

@Entity("game")
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text", { unique: true })
  objectID: string;

  @Column("text")
  title: string;

  @Column("text", { nullable: true })
  iconUrl: string | null;

  @Column("text", { nullable: true })
  folderName: string | null;

  @Column("text", { nullable: true })
  downloadPath: string | null;

  @Column("text", { nullable: true })
  executablePath: string | null;

  @Column("int", { default: 0 })
  playTimeInMilliseconds: number;

  @Column("text")
  shop: GameShop;

  @Column("text", { nullable: true })
  status: Aria2Status | null;

  @Column("int", { default: Downloader.Torrent })
  downloader: Downloader;

  /**
   * Progress is a float between 0 and 1
   */
  @Column("float", { default: 0 })
  progress: number;

  @Column("int", { default: 0 })
  bytesDownloaded: number;

  @Column("datetime", { nullable: true })
  lastTimePlayed: Date | null;

  @Column("float", { default: 0 })
  fileSize: number;

  @OneToOne(() => Repack, { nullable: true })
  @JoinColumn()
  repack: Repack;

  @Column("boolean", { default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
