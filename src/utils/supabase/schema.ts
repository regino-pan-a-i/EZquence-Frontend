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
};
