export type UserRole = "admin" | "retailer";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  flavour: string;
  nicotinePerPortionMg: number;
  nicotinePerGramMg: number;
  pouchesPerPack: string;
  packSize: string;
  format: string;
  origin: string;
  tobaccoFreePercent?: number;
  features: string[];
  image: string;
  overviewImage: string;
  active: boolean;
  sortOrder: number;
}

export interface ProvincePricing {
  id: string;
  province: string;
  provinceCode: string;
  productId: string;
  packQty: string;
  casePack: string;
  wholesale: number;
  ptt: number;
  msrpMin: number;
  msrpMax: number;
  marginMin: number;
  marginMax: number;
}

export interface IncentiveTier {
  id: string;
  name: string;
  minPacks: number;
  maxPacks: number | null;
  discountPercent: number;
  savePerPack: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  province?: string;
  address?: string;
  licenceNumber?: string;
  createdAt: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  company?: string;
  province: string;
  items: OrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  province?: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "closed";
}

export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  published: boolean;
  image?: string;
  imageTwo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiteContent {
  companyName: string;
  productLine: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  salesContact: string;
  minOrderPacks: number;
  ageRequirement: number;
}

export interface Database {
  products: Product[];
  pricing: ProvincePricing[];
  incentives: IncentiveTier[];
  users: User[];
  orders: Order[];
  leads: ContactLead[];
  site: SiteContent;
}
