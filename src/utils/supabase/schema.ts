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
  productImage: [{
      productId: number;
      imageURL: string;
    }
  ]
};

export type ProductListResponse = {
  success: boolean;
  data: Product[];
};

export type material = {
  materialId: number;
  materialUnits: string;
  name: string;
  processId: number;
  quantity: number;
  quantityinStock: number;
  units: string;
  expirationDate: Date;
  unitsNeeded: string;

}

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
  materials: material[];
};

export type ProcessResponse = {
  success: boolean;
  data: Process;
};
