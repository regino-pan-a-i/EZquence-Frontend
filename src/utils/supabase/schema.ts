// Auth Types
export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

export interface DecodedToken {
  user_role: UserRole;
  sub: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export type OrderResponse = {
  success: boolean;
  data: Order[];
};

export type Order = {
  orderId: number;
  orderTotal: number;
  dateCreated: Date;
  status: OrderStatus;
  paid: boolean;
  notes: string;
  userId: number;
  dateDelivered: Date;
  companyId: number;
};

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  STARTED = 'STARTED',
  PAID = 'PAID',
  DELAYED = 'DELAYED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export type Product = {
  productId: number;
  name: string;
  price: number;
  details: string;
  companyId: number;
  productImage: [
    {
      productId: number;
      imageURL: string;
    },
  ];
};

export type ProductListResponse = {
  success: boolean;
  data: Product[];
};

export type Material = {
  materialId: number;
  materialUnits: string;
  name: string;
  processId: number;
  quantityNeeded: number;
  quantityinStock: number;
  units: string;
  expirationDate: Date;
  unitsNeeded: string;
};

export type ProductResponse = {
  success: boolean;
  data: Product;
};

export type Process = {
  processId: number;
  name: string;
  details: string;
  productId: number;
  productsPerBatch: number;
  materials: Material[];
};

export type ProcessResponse = {
  success: boolean;
  data: Process;
};

export type DailyProductNeed = {
  productId: number;
  productName: string;
  quantityNeeded: number;
};

export type DailyProductNeedResponse = {
  success: boolean;
  data: DailyProductNeed[];
};

export type InventoryItem = {
  materialId: number;
  name: string;
  quantityInStock: number;
  units: string;
  companyId: number;
  expirationDate: Date | null;
};

export type InventoryResponse = {
  success: boolean;
  data: InventoryItem[];
};

export type InventoryNeed = {
  materialId: number;
  materialName: string;
  quantityInStock: number;
  quantityNeeded: number;
  units: string;
};

export type InventoryNeedResponse = {
  success: boolean;
  data: InventoryNeed[];
};
