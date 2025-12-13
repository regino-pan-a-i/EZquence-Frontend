// Auth Types
export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  CLIENT = 'CLIENT'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface DecodedToken {
  user_role: UserRole;
  sub: string;
  email?: string;
  exp?: number;
  iat?: number;
  usr_id?: number;
  user_company?: number;
  approvalStatus?: ApprovalStatus;
}

export interface Worker {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: number;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Company = {
  companyId: number;
  name: string;
  industry: string;
  description: string;
  logoURL: string;
  dateCreated: Date;
}

export type ProductionGoal = {
  productionGoalId: number;
  dateCreated: Date;
  goalValue: number;
  productId: number;
  companyId: number;
  effectiveDate: Date;
  endDate: Date;
}

export type ProductionGoalsResponse = {
  success: boolean;
  data: ProductionGoal[];
};

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  STARTED = 'STARTED',
  PAID = 'PAID',
  DELAYED = 'DELAYED',
  IN_PROGRESS = 'IN_PROGRESS',
}

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

export type OrdersByDateRangeResponse = {
  success: boolean;
  data: Order[];
};

export type OrderProductList = {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  companyId: number;
  productName: {
    name: string;
  };
}

export type OrderDetailsResponse = {
  success: boolean;
  data: {
    order: Order;
    products: OrderProductList[];
  };
};

export type ClientOrderDetailsResponse = {
    success: boolean;
  data: [{
    order: Order;
    products: OrderProductList[];
  }];
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

export type ProductInStock = {
  productId: number;
  productName: string;
  totalStock: number;
}

export type ProductInStockResponse = {
  success: boolean;
  data: ProductInStock;
};

export enum TransactionReason {
  PRODUCTION = 'PRODUCTION',
  ORDER_FULFILLMENT = 'ORDER_FULFILLMENT',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export type StockTransaction = {
  quantity: number;
  productId: number;
  companyId: number;
  reason: TransactionReason;
}

export enum CartStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type Cart = {
  cartId: number;
  createdDate: Date;
  updatedAt: Date;
  userId: number;
  cartStatus: CartStatus;
  companyId: number;
  notes: string;
}

export type cartItem = {
  cartId: number;
  productId: number;
  quantity: number;
  companyId: number;
  product : Product
}

export type customerFeedback = {
  feedbackId: number,
  userId: number,
  companyId: number,
  message: string,
  dateCreated: Date,
  resolved: boolean
}


export type materialTransaction = {
  materialTransactionId: number;
  materialId: number;
  companyId: number;
  cost: number;
  dateCreated: Date;
  quantity: number;
  units: string
}

export type materialTransactionResponse = {
  materialTransactionId: number;
  materialId: number;
  companyId: number;
  cost: number;
  dateCreated: Date;
  quantity: number;
  units: string
  material: {
    materialId: number;
    name: string;
    quantityInStock: number;
    units: string;
  }
}