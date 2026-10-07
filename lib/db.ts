import type { Collection, Document } from "mongodb";
import { getDb } from "./mongo";
import type {
  ContactLead,
  Blog,
  Faq,
  IncentiveTier,
  Order,
  Product,
  ProvincePricing,
  SiteContent,
  User,
} from "./types";

type WithMongoId<T> = T & { _id?: unknown };

function strip<T>(doc: WithMongoId<T> | null): T | null {
  if (!doc) return null;
  const { _id: _ignored, ...rest } = doc;
  return rest as T;
}

async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export async function getSite() {
  const site = await (await collection<SiteContent & { id: string }>("site")).findOne({
    id: "site",
  });
  if (!site) throw new Error("Site settings are missing");
  return strip(site)!;
}

export async function getProducts(activeOnly = true) {
  const products = await collection<Product>("products");
  const filter = activeOnly ? { active: true } : {};
  return products.find(filter).sort({ sortOrder: 1 }).toArray().then((rows) => rows.map((row) => strip(row)!));
}

export async function getProductBySlug(slug: string) {
  const products = await collection<Product>("products");
  return strip(await products.findOne({ slug }));
}

export async function getProductById(id: string) {
  const products = await collection<Product>("products");
  return strip(await products.findOne({ id }));
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>
): Promise<Product | null> {
  const products = await collection<Product>("products");
  const updated = await products.findOneAndUpdate(
    { id },
    { $set: { ...patch, id } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function createProduct(
  input: Omit<Product, "id" | "sortOrder"> & { sortOrder?: number }
): Promise<Product> {
  const products = await collection<Product>("products");
  const taken = await products.findOne({ slug: input.slug });
  if (taken) throw new Error("Slug already exists");
  const highest = await products.find().sort({ sortOrder: -1 }).limit(1).next();
  const record: Product = {
    ...input,
    id: `prod_${Date.now()}`,
    sortOrder: input.sortOrder ?? (highest?.sortOrder ?? 0) + 1,
  };
  await products.insertOne(record);
  return record;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await collection<Product>("products");
  const result = await products.deleteOne({ id });
  return result.deletedCount === 1;
}

export async function getPricing(provinceCode?: string) {
  const pricing = await collection<ProvincePricing>("pricing");
  const filter = provinceCode
    ? { provinceCode: { $regex: `^${provinceCode}$`, $options: "i" } }
    : {};
  const rows = await pricing.find(filter).toArray();
  return rows.map((row) => strip(row)!);
}

export async function updatePricing(id: string, patch: Partial<ProvincePricing>) {
  const pricing = await collection<ProvincePricing>("pricing");
  const updated = await pricing.findOneAndUpdate(
    { id },
    { $set: { ...patch, id } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function getIncentives() {
  const incentives = await collection<IncentiveTier>("incentives");
  const rows = await incentives.find().toArray();
  return rows.map((row) => strip(row)!);
}

export async function getUsers() {
  const users = await collection<User>("users");
  const rows = await users.find().toArray();
  return rows.map((row) => strip(row)!);
}

export async function getUserByEmail(email: string) {
  const users = await collection<User>("users");
  return strip(
    await users.findOne({
      email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    })
  );
}

export async function getUserById(id: string) {
  const users = await collection<User>("users");
  return strip(await users.findOne({ id }));
}

export async function createUser(
  user: Omit<User, "id" | "createdAt" | "active"> & { active?: boolean }
) {
  const users = await collection<User>("users");
  const existing = await getUserByEmail(user.email);
  if (existing) throw new Error("Email already registered");
  const record: User = {
    ...user,
    id: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
    active: user.active ?? true,
  };
  await users.insertOne(record);
  return record;
}

export async function updateUser(id: string, patch: Partial<User>) {
  const users = await collection<User>("users");
  const updated = await users.findOneAndUpdate(
    { id },
    { $set: { ...patch, id } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function getOrders(userId?: string) {
  const orders = await collection<Order>("orders");
  const filter = userId ? { userId } : {};
  const rows = await orders.find(filter).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => strip(row)!);
}

export async function getOrderById(id: string) {
  const orders = await collection<Order>("orders");
  return strip(await orders.findOne({ id }));
}

export async function createOrder(
  order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">
) {
  const orders = await collection<Order>("orders");
  const count = await orders.countDocuments();
  const now = new Date().toISOString();
  const record: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    orderNumber: `DYN-2026-${1000 + count + 1}`,
    createdAt: now,
    updatedAt: now,
  };
  await orders.insertOne(record);
  return record;
}

export async function updateOrder(id: string, patch: Partial<Order>) {
  const orders = await collection<Order>("orders");
  const updated = await orders.findOneAndUpdate(
    { id },
    { $set: { ...patch, id, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function getLeads() {
  const leads = await collection<ContactLead>("leads");
  const rows = await leads.find().sort({ createdAt: -1 }).toArray();
  return rows.map((row) => strip(row)!);
}

export async function createLead(
  lead: Omit<ContactLead, "id" | "createdAt" | "status">
) {
  const leads = await collection<ContactLead>("leads");
  const record: ContactLead = {
    ...lead,
    id: `lead_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  await leads.insertOne(record);
  return record;
}

export async function updateLead(id: string, patch: Partial<ContactLead>) {
  const leads = await collection<ContactLead>("leads");
  const updated = await leads.findOneAndUpdate(
    { id },
    { $set: { ...patch, id } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function getBlogs(publishedOnly = true) {
  const blogs = await collection<Blog>("blogs");
  const filter = publishedOnly ? { published: true } : {};
  const rows = await blogs.find(filter).sort({ createdAt: -1 }).toArray();
  return rows.map((row) => strip(row)!);
}

export async function getBlogBySlug(slug: string) {
  const blogs = await collection<Blog>("blogs");
  return strip(await blogs.findOne({ slug }));
}

export async function getBlogById(id: string) {
  const blogs = await collection<Blog>("blogs");
  return strip(await blogs.findOne({ id }));
}

export async function createBlog(
  input: Omit<Blog, "id" | "createdAt" | "updatedAt">
) {
  const blogs = await collection<Blog>("blogs");
  const taken = await blogs.findOne({ slug: input.slug });
  if (taken) throw new Error("Slug already exists");
  const now = new Date().toISOString();
  const record: Blog = {
    ...input,
    id: `blog_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  await blogs.insertOne(record);
  return record;
}

export async function updateBlog(id: string, patch: Partial<Blog>) {
  const blogs = await collection<Blog>("blogs");
  if (patch.slug) {
    const taken = await blogs.findOne({ slug: patch.slug, id: { $ne: id } });
    if (taken) throw new Error("Slug already exists");
  }
  const updated = await blogs.findOneAndUpdate(
    { id },
    { $set: { ...patch, id, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function deleteBlog(id: string) {
  const blogs = await collection<Blog>("blogs");
  const result = await blogs.deleteOne({ id });
  return result.deletedCount === 1;
}

export async function getFaqs(publishedOnly = true) {
  const faqs = await collection<Faq>("faqs");
  const filter = publishedOnly ? { published: true } : {};
  const rows = await faqs
    .find(filter)
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();
  return rows.map((row) => strip(row)!);
}

export async function getFaqById(id: string) {
  const faqs = await collection<Faq>("faqs");
  return strip(await faqs.findOne({ id }));
}

export async function createFaq(
  input: Omit<Faq, "id" | "createdAt" | "updatedAt" | "sortOrder"> & {
    sortOrder?: number;
  }
) {
  const faqs = await collection<Faq>("faqs");
  const now = new Date().toISOString();
  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await faqs.find().sort({ sortOrder: -1 }).limit(1).toArray();
    sortOrder = (last[0]?.sortOrder ?? 0) + 1;
  }
  const record: Faq = {
    question: input.question,
    answer: input.answer,
    published: input.published,
    sortOrder,
    id: `faq_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  await faqs.insertOne(record);
  return record;
}

export async function updateFaq(id: string, patch: Partial<Faq>) {
  const faqs = await collection<Faq>("faqs");
  const updated = await faqs.findOneAndUpdate(
    { id },
    { $set: { ...patch, id, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return strip(updated);
}

export async function deleteFaq(id: string) {
  const faqs = await collection<Faq>("faqs");
  const result = await faqs.deleteOne({ id });
  return result.deletedCount === 1;
}

export async function getDashboardStats() {
  const [products, users, orders, leads] = await Promise.all([
    getProducts(false),
    getUsers(),
    getOrders(),
    getLeads(),
  ]);
  const retailers = users.filter((user) => user.role === "retailer");
  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  return {
    products: products.filter((product) => product.active).length,
    retailers: retailers.length,
    orders: orders.length,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    leads: leads.filter((lead) => lead.status === "new").length,
    revenue,
  };
}
