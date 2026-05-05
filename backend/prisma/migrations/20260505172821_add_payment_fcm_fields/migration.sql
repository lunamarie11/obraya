-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "paymentUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fcmToken" TEXT;
