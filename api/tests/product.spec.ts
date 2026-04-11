import { productService } from '../src/modules/products/product.service';
import { Product } from '../src/modules/products/product.model';
import { redis } from '../src/config/database';

// Mock dependencies
jest.mock('../src/modules/products/product.model');
jest.mock('../src/config/database', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Pizza Margherita',
  description: 'Classico italiano',
  price: 42.90,
  image: '',
  category: 'pizzas',
  active: true,
  preparation_time: 25,
  customizations: [
    {
      _id: '507f1f77bcf86cd799439012',
      type: 'size',
      name: 'Pequena',
      price_modifier: 0,
      available: true,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProducts = [
  mockProduct,
  {
    _id: '507f1f77bcf86cd799439013',
    name: 'Pizza Pepperoni',
    description: 'Pepperoni artesanal',
    price: 48.90,
    image: '',
    category: 'pizzas',
    active: true,
    preparation_time: 25,
    customizations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMenu', () => {
    it('deve buscar todos os produtos do banco quando cache miss', async () => {
      (redis!.get as jest.Mock).mockResolvedValue(null);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };
      (Product.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await productService.getMenu();

      expect(Product.find).toHaveBeenCalledWith({ active: true });
      expect(redis!.setex).toHaveBeenCalledWith(
        'menu:all',
        300,
        JSON.stringify(mockProducts)
      );
      expect(result).toEqual(mockProducts);
    });

    it('deve usar cache Redis na segunda chamada', async () => {
      (redis!.get as jest.Mock).mockResolvedValue(JSON.stringify(mockProducts));

      const result = await productService.getMenu();

      expect(Product.find).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Pizza Margherita');
      expect(result[1].name).toBe('Pizza Pepperoni');
    });
  });

  describe('getProductById', () => {
    it('deve buscar produto por ID', async () => {
      (redis!.get as jest.Mock).mockResolvedValue(null);

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockProduct),
      };
      (Product.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await productService.getProductById('507f1f77bcf86cd799439011');

      expect(Product.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(redis!.setex).toHaveBeenCalledWith(
        'menu:product:507f1f77bcf86cd799439011',
        600,
        JSON.stringify(mockProduct)
      );
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar 404 se produto nao encontrado', async () => {
      (redis!.get as jest.Mock).mockResolvedValue(null);

      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (Product.findById as jest.Mock).mockReturnValue(mockQuery);

      await expect(
        productService.getProductById('nonexistent')
      ).rejects.toThrow('Produto nao encontrado');
    });
  });

  describe('getByCategory', () => {
    it('deve buscar por categoria', async () => {
      (redis!.get as jest.Mock).mockResolvedValue(null);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts),
      };
      (Product.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await productService.getByCategory('pizzas');

      expect(Product.find).toHaveBeenCalledWith({
        category: 'pizzas',
        active: true,
      });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('searchByName', () => {
    it('deve fazer busca por nome', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockProduct]),
      };
      (Product.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await productService.searchByName('Margherita');

      expect(Product.find).toHaveBeenCalledWith({
        active: true,
        name: { $regex: 'Margherita', $options: 'i' },
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('invalidateCache', () => {
    it('deve invalidar cache ao atualizar', async () => {
      (redis!.keys as jest.Mock).mockResolvedValue(['menu:all', 'menu:category:pizzas']);

      await productService.invalidateCache();

      expect(redis!.keys).toHaveBeenCalledWith('menu:*');
      expect(redis!.del).toHaveBeenCalledWith('menu:all', 'menu:category:pizzas');
    });

    it('nao deve chamar del se nao houver chaves', async () => {
      (redis!.keys as jest.Mock).mockResolvedValue([]);

      await productService.invalidateCache();

      expect(redis!.del).not.toHaveBeenCalled();
    });
  });
});
