import { promises as fs } from "fs";
import path from "path";
import type {
  ContactLead,
  Database,
  Order,
  Product,
  ProvincePricing,
  User,
} from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function readDb(): Promise<Database> {
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as Database;
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function getSite() {
  const db = await readDb();
  return db.site;
}

export async function getProducts(activeOnly = true) {
  const db = await readDb();
  const list = db.products.sort((a, b) => a.sortOrder - b.sortOrder);
  return activeOnly ? list.filter((p) => p.active) : list;
}

export async function getProductBySlug(slug: string) {
  const db = await readDb();
  return db.products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  const db = await readDb();
  return db.products.find((p) => p.id === id) ?? null;
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product | null> {
  const db = await readDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.products[index] = { ...db.products[index], ...patch, id };
  await writeDb(db);
  return db.products[index];
}

export async function createProduct(
  input: Omit<Product, "id" | "sortOrder"> & { sortOrder?: number }
): Promise<Product> {
  const db = await readDb();
  const slugTaken = db.products.some((p) => p.slug === input.slug);
  if (slugTaken) throw new Error("Slug already exists");
  const maxSort = db.products.reduce((m, p) => Math.max(m, p.sortOrder), 0);
  const record: Product = {
    ...input,
    id: `prod_${Date.now()}`,
    sortOrder: input.sortOrder ?? maxSort + 1,
  };
  db.products.push(record);
  await writeDb(db);
  return record;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length === before) return false;
  await writeDb(db);
  return true;
}

export async function getPricing(provinceCode?: string) {
  const db = await readDb();
  if (!provinceCode) return db.pricing;
  return db.pricing.filter(
    (p) => p.provinceCode.toLowerCase() === provinceCode.toLowerCase()
  );
}

export async function updatePricing(
  id: string,
  patch: Partial<ProvincePricing>
) {
  const db = await readDb();
  const index = db.pricing.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.pricing[index] = { ...db.pricing[index], ...patch, id };
  await writeDb(db);
  return db.pricing[index];
}

export async function getIncentives() {
  const db = await readDb();
  return db.incentives;
}

export async function getUsers() {
  const db = await readDb();
  return db.users;
}

export async function getUserByEmail(email: string) {
  const db = await readDb();
  return (
    db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export async function getUserById(id: string) {
  const db = await readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(
  user: Omit<User, "id" | "createdAt" | "active"> & {
    active?: boolean;
  }
) {
  const db = await readDb();
  const existing = db.users.find(
    (u) => u.email.toLowerCase() === user.email.toLowerCase()
  );
  if (existing) throw new Error("Email already registered");
  const record: User = {
    ...user,
    id: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
    active: user.active ?? true,
  };
  db.users.push(record);
  await writeDb(db);
  return record;
}

export async function updateUser(id: string, patch: Partial<User>) {
  const db = await readDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  db.users[index] = { ...db.users[index], ...patch, id };
  await writeDb(db);
  return db.users[index];
}

export async function getOrders(userId?: string) {
  const db = await readDb();
  const list = db.orders.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  return userId ? list.filter((o) => o.userId === userId) : list;
}

export async function getOrderById(id: string) {
  const db = await readDb();
  return db.orders.find((o) => o.id === id) ?? null;
}

export async function createOrder(
  order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">
) {
  const db = await readDb();
  const seq = 1000 + db.orders.length + 1;
  const now = new Date().toISOString();
  const record: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    orderNumber: `DYN-2026-${seq}`,
    createdAt: now,
    updatedAt: now,
  };
  db.orders.unshift(record);
  await writeDb(db);
  return record;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const db = await readDb();
  const index = db.orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  db.orders[index] = {
    ...db.orders[index],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(db);
  return db.orders[index];
}

export async function getLeads() {
  const db = await readDb();
  return db.leads.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
}

export async function createLead(
  lead: Omit<ContactLead, "id" | "createdAt" | "status">
) {
  const db = await readDb();
  const record: ContactLead = {
    ...lead,
    id: `lead_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  db.leads.unshift(record);
  await writeDb(db);
  return record;
}

export async function updateLead(id: string, patch: Partial<ContactLead>) {
  const db = await readDb();
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return null;
  db.leads[index] = { ...db.leads[index], ...patch, id };
  await writeDb(db);
  return db.leads[index];
}

export async function getDashboardStats() {
  const db = await readDb();
  const retailers = db.users.filter((u) => u.role === "retailer");
  const revenue = db.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  return {
    products: db.products.filter((p) => p.active).length,
    retailers: retailers.length,
    orders: db.orders.length,
    pendingOrders: db.orders.filter((o) => o.status === "pending").length,
    leads: db.leads.filter((l) => l.status === "new").length,
    revenue,
  };
}
