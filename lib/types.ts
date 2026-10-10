export type UserRole = "admin" | "retailer";

export type OrderStatus =
  | "pending"
  | "accepted"
  /** @deprecated Prefer "accepted"; kept for existing orders. */
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

export type LicenseReview = "pending" | "approved" | "rejected";

export type ProfileStatus =
  | "incomplete"
  | "license_missing"
  | "pending"
  | "rejected"
  | "expired"
  | "verified";

export interface StoredLicense {
  fileName: string;
  storedName: string;
  expiryDate: string;
  uploadedAt: string;
  review: LicenseReview;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface ProfileAuditEntry {
  id: string;
  at: string;
  actor: "customer" | "admin";
  message: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  country?: string;
  company?: string;
  phone?: string;
  province?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  licenceNumber?: string;
  license?: StoredLicense;
  license2?: StoredLicense;
  license3?: StoredLicense;
  verificationReview?: LicenseReview;
  profileAudit?: ProfileAuditEntry[];
  createdAt: string;
  active: boolean;
}

export interface AdminNotice {
  id: string;
  userId: string;
  userName: string;
  kind: "profile" | "license" | "order";
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceLineOverride {
  productId: string;
  description: string;
  pttUnit: number;
  no?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  totalPtt?: number;
  amount?: number;
}

export interface InvoiceOverrides {
  billToName: string;
  billToAddress: string;
  billToPhone: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  lines: InvoiceLineOverride[];
  subtotal?: number;
  discountAmount?: number;
  ptt?: number;
  totalAmount?: number;
  gst?: number;
  amountDue?: number;
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
  discountTier?: string;
  monthPacksBefore?: number;
  qualifyingPacks?: number;
  total: number;
  status: OrderStatus;
  profileVerificationStatus?: ProfileStatus;
  pendingProfileVerification?: boolean;
  notes?: string;
  invoiceOverrides?: InvoiceOverrides;
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

export interface WholesaleInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  province: string;
  address?: string;
  licenceNumber?: string;
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
  wholesaleInquiries: WholesaleInquiry[];
  site: SiteContent;
}
