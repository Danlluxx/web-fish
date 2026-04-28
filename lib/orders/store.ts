import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StoredOrder } from "@/types/order";

const ORDERS_DIR = path.join(process.cwd(), "data", "orders");
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.json");
const ORDER_ARCHIVES_DIR = path.join(ORDERS_DIR, "archive");

async function readOrdersFromFile(filePath: string): Promise<StoredOrder[]> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as StoredOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrdersToFile(filePath: string, orders: StoredOrder[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(sortOrdersNewestFirst(orders), null, 2) + "\n", "utf-8");
}

function sortOrdersNewestFirst(orders: StoredOrder[]): StoredOrder[] {
  return [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function getOrderMonthKey(createdAt: string): string {
  const normalizedValue = createdAt.slice(0, 7);

  if (/^\d{4}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return "unknown";
  }

  return parsedDate.toISOString().slice(0, 7);
}

function getOrderArchivePath(monthKey: string): string {
  return path.join(ORDER_ARCHIVES_DIR, `${monthKey}.json`);
}

function mergeUniqueOrders(orders: StoredOrder[]): StoredOrder[] {
  const uniqueOrders = new Map<string, StoredOrder>();

  for (const order of orders) {
    if (!uniqueOrders.has(order.id)) {
      uniqueOrders.set(order.id, order);
    }
  }

  return sortOrdersNewestFirst([...uniqueOrders.values()]);
}

async function archiveOrdersByMonth(orders: StoredOrder[]): Promise<void> {
  if (orders.length === 0) {
    return;
  }

  const ordersByMonth = new Map<string, StoredOrder[]>();

  for (const order of orders) {
    const monthKey = getOrderMonthKey(order.createdAt);
    const monthOrders = ordersByMonth.get(monthKey) ?? [];
    monthOrders.push(order);
    ordersByMonth.set(monthKey, monthOrders);
  }

  for (const [monthKey, monthOrders] of ordersByMonth.entries()) {
    const archivePath = getOrderArchivePath(monthKey);
    const existingArchive = await readOrdersFromFile(archivePath);

    await writeOrdersToFile(archivePath, mergeUniqueOrders([...monthOrders, ...existingArchive]));
  }
}

async function rotateCurrentOrdersForMonth(activeMonthKey: string): Promise<void> {
  const currentOrders = await readOrdersFromFile(ORDERS_FILE);

  if (currentOrders.length === 0) {
    return;
  }

  const ordersToKeep = currentOrders.filter(
    (order) => getOrderMonthKey(order.createdAt) === activeMonthKey
  );
  const ordersToArchive = currentOrders.filter(
    (order) => getOrderMonthKey(order.createdAt) !== activeMonthKey
  );

  if (ordersToArchive.length === 0) {
    return;
  }

  await archiveOrdersByMonth(ordersToArchive);
  await writeOrdersToFile(ORDERS_FILE, ordersToKeep);
}

export async function appendOrder(order: StoredOrder): Promise<void> {
  await mkdir(ORDERS_DIR, { recursive: true });
  await rotateCurrentOrdersForMonth(getOrderMonthKey(order.createdAt));

  const currentOrders = await readOrdersFromFile(ORDERS_FILE);
  await writeOrdersToFile(ORDERS_FILE, mergeUniqueOrders([order, ...currentOrders]));
}
