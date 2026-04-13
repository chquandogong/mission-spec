import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const projectDir = process.cwd();
const missionPath = join(projectDir, "mission.yaml");

if (!existsSync(missionPath)) {
  process.exit(0);
}

const content = readFileSync(missionPath, "utf-8");
const missionData = parse(content);
const version = missionData?.mission?.version;

if (!version) {
  console.error("mission.yaml에 version 필드가 없습니다.");
  process.exit(1);
}

const dateObj = new Date();
const year = dateObj.getFullYear();
const month = String(dateObj.getMonth() + 1).padStart(2, "0");
const day = String(dateObj.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const snapshotName = `${date}_v${version}_mission.yaml`;
const snapshotDir = join(projectDir, ".mission", "snapshots");
const snapshotPath = join(snapshotDir, snapshotName);

if (!existsSync(snapshotDir)) {
  mkdirSync(snapshotDir, { recursive: true });
}

const existingSnapshot = readdirSync(snapshotDir).find((name) =>
  name.endsWith(`_v${version}_mission.yaml`),
);

if (existingSnapshot) {
  if (existingSnapshot !== snapshotName) {
    console.log(`기존 버전 스냅샷 유지: ${existingSnapshot}`);
  }
  process.exit(0);
}

if (!existsSync(snapshotPath)) {
  console.log(`새로운 스냅샷 생성: ${snapshotName}`);
  copyFileSync(missionPath, snapshotPath);
  // 스테이징은 호출측(pre-commit 훅 등)에서 수행합니다.
  // 스크립트 자체는 git 상태를 변경하지 않습니다.
}
