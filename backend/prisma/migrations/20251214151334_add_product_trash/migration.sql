/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `CancellationRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "CancellationRequest_orderId_key" ON "CancellationRequest"("orderId");
