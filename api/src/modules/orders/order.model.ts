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
  address: {
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
    address: {
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
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
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export const OrderLog = mongoose.model<IOrderDocument>('order_logs', OrderLogSchema);
