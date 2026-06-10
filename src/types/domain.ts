export type ProductStatus = "ACTIVE" | "HIDDEN" | "OUT_OF_STOCK";
export type DeliveryMethod = "DELIVERY" | "PICKUP";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_UNDER_REVIEW"
  | "PAYMENT_CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";
export type PaymentStatus =
  | "UNPAID"
  | "PROOF_SENT_ON_WHATSAPP"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "REJECTED";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
export type UserRole =
  | "CUSTOMER"
  | "ATTENDANT"
  | "MEDIA_MANAGER"
  | "MODERATOR"
  | "SUPER_ADMIN";

export interface SafeAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

export interface AdminRegistrationResult {
  user: SafeAuthUser;
  adminProfile: {
    role: UserRole;
    status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  };
}

export interface AdminRegistrationCodePanel {
  version: number;
  window: number;
  expiresAt: string;
  generatedAt: string;
  rotatedAt: string | null;
  rotatedByUserId: string | null;
  codes: Array<{
    role: Exclude<UserRole, "CUSTOMER">;
    label: string;
    code: string;
  }>;
}

export interface AdminUserListItem {
  id: string;
  role: Exclude<UserRole, "CUSTOMER">;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    lastLoginAt: string | null;
  };
}

export interface PublicProductImage {
  id: string;
  url: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface PublicProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string | null;
  sortOrder: number;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  status: ProductStatus;
  isOrderable: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  sortOrder: number;
  variants: PublicProductVariant[];
  images: PublicProductImage[];
}

export type HeroProductSource =
  | "ADMIN_SELECTED"
  | "RECENT"
  | "MOST_BOUGHT"
  | "FEATURED_POPULAR"
  | "CATALOG_FALLBACK";

export interface PublicHeroProduct extends PublicProduct {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  heroSource: HeroProductSource;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  products: PublicProduct[];
}

export interface PublicMenuResponse {
  categories: PublicCategory[];
}

export interface PublicCategoryNavigationItem {
  id: string;
  name: string;
  slug: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  slug: string;
  baseFee: number;
}

export interface DeliveryQuote {
  deliveryMethod: DeliveryMethod;
  deliveryZone: {
    id: string;
    name: string;
    slug: string;
  } | null;
  baseFee: number;
  surcharge: number;
  totalFee: number;
  appliedSurchargeRules: Array<{
    id: string;
    name: string;
    amount: number;
    startsAtTime: string;
    endsAtTime: string | null;
  }>;
  quotedAt: string;
}

export interface CheckoutResult {
  orderNumber: string;
  customerType: "GUEST" | "AUTHENTICATED";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "BANK_TRANSFER";
  subtotal: number;
  total: number;
  delivery: {
    method: DeliveryMethod;
    address: string | null;
    zoneId: string | null;
    zoneName: string | null;
    baseFee: number;
    surcharge: number;
    totalFee: number;
  };
  items: Array<{
    productName: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  invoiceNumber: string | null;
  paymentInstruction: string;
  invoiceUrl: string;
  whatsAppProofUrl: string;
  whatsAppProofMessage: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  htmlSnapshot: string;
  pdfUrl: string | null;
  generatedAt: string;
  createdAt: string;
  order: {
    orderNumber: string;
    customerNameSnapshot: string;
    customerPhoneSnapshot: string;
    customerEmailSnapshot: string | null;
    subtotal: number;
    total: number;
    status: string;
    paymentStatus: string;
  };
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  sku: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminProductImage {
  id: string;
  productId: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  mediaAsset: {
    id: string;
    publicUrl: string | null;
    status: string;
    contentType: string;
    byteSize: number;
  };
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  status: ProductStatus;
  showWhenOutOfStock: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category: AdminCategory;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
}

export interface AdminHomepageHeroProduct {
  id: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    status: ProductStatus;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface AdminDeliveryZone {
  id: string;
  name: string;
  slug: string;
  baseFee: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminSurchargeRule {
  id: string;
  name: string;
  startsAtTime: string;
  endsAtTime: string | null;
  amount: number;
  isActive: boolean;
}

export interface PaymentSettings {
  id: string;
  settingKey: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
  proofWhatsappNumber: string;
  isActive: boolean;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  bodySchemaOrComponentKey: string;
  isActive: boolean;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfileResponse {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  customerProfile: {
    fullName: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface CustomerOrderListItem {
  orderNumber: string;
  customerType: "GUEST" | "AUTHENTICATED";
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  deliveryMethod: DeliveryMethod;
  deliveryZoneNameSnapshot: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "BANK_TRANSFER";
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  deliveredAt: string | null;
  invoice: {
    invoiceNumber: string;
  } | null;
  _count: {
    items: number;
  };
}

export interface PublicReview {
  id: string;
  customerNameSnapshot: string;
  rating: number;
  comment: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  } | null;
}
