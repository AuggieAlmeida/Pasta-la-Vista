-- AlterTable
ALTER TABLE "orders" ADD COLUMN "saved_card_id" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_saved_card_id_fkey" FOREIGN KEY ("saved_card_id") REFERENCES "user_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
