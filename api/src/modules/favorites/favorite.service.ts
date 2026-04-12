import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

export const favoriteService = {
  async addFavorite(userId: string, productId: string) {
    try {
      return await prisma.userFavorite.create({
        data: { userId, productId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') return true; // Already favorite
      throw error;
    }
  },

  async removeFavorite(userId: string, productId: string) {
    const fav = await prisma.userFavorite.findUnique({
      where: { userId_productId: { userId, productId } }
    });
    if (!fav) return false;

    await prisma.userFavorite.delete({
      where: { id: fav.id }
    });
    return true;
  },

  async getFavorites(userId: string) {
    // Only return the strings to filter at frontend 
    // or return full list? Front end just needs boolean matching, returning strings is fast.
    const favs = await prisma.userFavorite.findMany({
      where: { userId },
      select: { productId: true }
    });
    return favs.map(f => f.productId);
  }
};
