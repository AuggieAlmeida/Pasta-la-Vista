import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

export const profileService = {
  // ─── Endereços ──────────────────────────────────────────
  async listAddresses(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  },

  async addAddress(userId: string, data: any) {
    // Se for marcado como default, desmarcar os outros
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Se for o primeiro, forçar como default
    const count = await prisma.userAddress.count({ where: { userId } });
    if (count === 0) {
      data.isDefault = true;
    }

    return prisma.userAddress.create({
      data: {
        userId,
        street: data.street,
        number: data.number,
        complement: data.complement,
        city: data.city,
        state: data.state,
        zip: data.zip,
        isDefault: data.isDefault || false,
      },
    });
  },

  async deleteAddress(id: string, userId: string) {
    const address = await prisma.userAddress.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw new NotFoundError('Endereço não encontrado');
    }
    return prisma.userAddress.delete({ where: { id } });
  },

  // ─── Cartões (Mocados Localmente por agora sem criar customer) ───
  async listCards(userId: string) {
    return prisma.userCard.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  },

  async addCard(userId: string, data: any) {
    if (data.isDefault) {
      await prisma.userCard.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await prisma.userCard.count({ where: { userId } });
    if (count === 0) {
      data.isDefault = true;
    }

    return prisma.userCard.create({
      data: {
        userId,
        last4: data.last4,
        brand: data.brand,
        stripePaymentMethodId: data.stripePaymentMethodId, // Token gerado no front
        isDefault: data.isDefault || false,
      },
    });
  },

  async deleteCard(id: string, userId: string) {
    const card = await prisma.userCard.findUnique({ where: { id } });
    if (!card || card.userId !== userId) {
      throw new NotFoundError('Cartão não encontrado');
    }
    return prisma.userCard.delete({ where: { id } });
  },
};
