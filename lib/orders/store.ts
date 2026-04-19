import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StoredOrder } from "@/types/order";

const ORDERS_DIR = path.join(process.cwd(), "data", "orders");
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.json");

async function readOrders(): Promise<StoredOrder[]> {
  try {
    const raw = await readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendOrder(order: StoredOrder): Promise<void> {
  await mkdir(ORDERS_DIR, { recursive: true });
  const orders = await readOrders();
  orders.unshift(order);
  await writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2) + "\n", "utf-8");
}
