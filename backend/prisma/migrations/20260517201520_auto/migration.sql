-- CreateIndex
CREATE INDEX "Purchase_userId_date_idx" ON "Purchase"("userId", "date");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");
