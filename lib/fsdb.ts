import { promises as fs } from "fs";
import path from "path";
import { Transaction, TransactionType, Setting, SettingType, Card, CardType } from "../schema/schemas";

const dataDir = path.join(process.cwd(), "data");
const transactionPath = path.join(dataDir, "transactions.json");
const settingPath = path.join(dataDir, "settings.json");
const cardPath = path.join(dataDir, "cards.json");

async function ensure() {
  try { await fs.mkdir(dataDir, { recursive: true }); } catch { }
  try { await fs.access(transactionPath); } catch { await fs.writeFile(transactionPath, "[]", "utf-8"); }
  try { await fs.access(settingPath); } catch { await fs.writeFile(settingPath, JSON.stringify(Setting.parse({}), null, 2)); }
  try { await fs.access(cardPath); } catch { await fs.writeFile(cardPath, "[]", "utf-8"); }
}

export async function loadTransactions(): Promise<TransactionType[]> {
  await ensure();
  const raw = await fs.readFile(transactionPath, "utf-8");
  const arr = JSON.parse(raw);
  console.log("Loaded transactions:", arr);
  return arr.map((x: any) => Transaction.parse(x));
}

export async function saveTransactions(list: TransactionType[]) {
  await ensure();
  await fs.writeFile(transactionPath, JSON.stringify(list, null, 2), "utf-8");
}

export async function loadSetting(): Promise<SettingType> {
  await ensure();
  const raw = await fs.readFile(settingPath, "utf-8");
  return Setting.parse(JSON.parse(raw));
}

export async function saveSetting(s: SettingType) {
  await ensure();
  await fs.writeFile(settingPath, JSON.stringify(Setting.parse(s), null, 2), "utf-8");
}

export async function loadCards(): Promise<CardType[]> {
  await ensure();
  const raw = await fs.readFile(cardPath, "utf-8");
  const arr = JSON.parse(raw);
  return arr.map((x: any) => Card.parse(x));
}

export async function saveCards(list: CardType[]) {
  await ensure();
  await fs.writeFile(cardPath, JSON.stringify(list, null, 2), "utf-8");
}