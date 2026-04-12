import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderDocument extends Document {
  _id: mongoose.Types.ObjectId;
  order_id: string;
  user_id: string;
  items: IOrderItemDoc[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  status: string;
  delivery_mode: string;
  table_number?: string;
  coupon_code?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
  review?: IReviewDoc;
}

export interface IReviewDoc {
  rating: number;
  comment: string;
  created_at: Date;
}

export interface IOrderItemDoc {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  customizations: {
    customization_id: string;
    name: string;
    price_modifier: number;
  }[];
  subtotal: number;
}

const OrderItemSchema = new Schema({
  product_id: { type: String, required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  customizations: [{
    customization_id: { type: String, required: true },
    name: { type: String, required: true },
    price_modifier: { type: Number, required: true, default: 0 },
  }],
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const ReviewSchema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { _id: false, timestamps: { createdAt: 'created_at', updatedAt: false } });

const OrderLogSchema = new Schema<IOrderDocument>(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    delivery_fee: {
      type: Number,
      required: true,
      default: 5.0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    delivery_mode: {
      type: String,
      required: true,
      enum: ['DELIVERY', 'PICKUP', 'DINE_IN'],
      default: 'DELIVERY',
    },
    table_number: {
      type: String,
      required: false,
    },
    coupon_code: {
      type: String,
      required: false,
    },
    address: {
      street: { type: String, required: false },
      number: { type: String, required: false },
      complement: { type: String, required: false },
      city: { type: String, required: false },
      state: { type: String, required: false },
      zip: { type: String, required: false },
    },
    notes: {
      type: String,
      default: '',
    },
    payment_method: {
      type: String,
      required: true,
      enum: ['PIX', 'CREDIT_CARD', 'CASH'],
    },
    review: {
      type: ReviewSchema,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export const OrderLog = mongoose.model<IOrderDocument>('order_logs', OrderLogSchema);
