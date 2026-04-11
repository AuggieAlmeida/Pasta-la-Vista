import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomization {
  _id?: mongoose.Types.ObjectId;
  type: string;
  name: string;
  price_modifier: number;
  available: boolean;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  active: boolean;
  preparation_time: number;
  customizations: ICustomization[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomizationSchema = new Schema<ICustomization>({
  type: {
    type: String,
    required: [true, 'Tipo de customizacao e obrigatorio'],
    enum: ['size', 'ingredient'],
  },
  name: {
    type: String,
    required: [true, 'Nome da customizacao e obrigatorio'],
  },
  price_modifier: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Modificador de preco nao pode ser negativo'],
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Nome do produto e obrigatorio'],
      index: true,
      trim: true,
      maxlength: [200, 'Nome deve ter no maximo 200 caracteres'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Descricao deve ter no maximo 1000 caracteres'],
    },
    price: {
      type: Number,
      required: [true, 'Preco e obrigatorio'],
      min: [0.01, 'Preco deve ser maior que zero'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Categoria e obrigatoria'],
      index: true,
      enum: ['pizzas', 'bebidas', 'sobremesas', 'massas', 'aperitivos'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    preparation_time: {
      type: Number,
      default: 30,
      min: [1, 'Tempo de preparo deve ser pelo menos 1 minuto'],
    },
    customizations: {
      type: [CustomizationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, active: 1 });

export const Product = mongoose.model<IProduct>('products', ProductSchema);
