-- Giờ vận hành (VN) — ca tự động khi trong khung giờ này
ALTER TABLE "RestaurantSettings" ADD COLUMN "operationsOpenTime" TEXT NOT NULL DEFAULT '10:00';
ALTER TABLE "RestaurantSettings" ADD COLUMN "operationsCloseTime" TEXT NOT NULL DEFAULT '23:00';
