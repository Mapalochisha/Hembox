-- This migration was generated from a read-only diff of the connected database.
-- It is additive and intentionally does not create Shipment records for legacy orders.

CREATE TYPE "ShippingPointSource" AS ENUM ('VARIANT_OVERRIDE', 'PRODUCT_DEFAULT', 'SYSTEM_DEFAULT');
CREATE TYPE "ShippingPriceStrategy" AS ENUM ('MATCH_COURIER_COST', 'FIXED_AMOUNT', 'MARKUP_AMOUNT', 'MARKUP_PERCENT', 'SUBSIDY_AMOUNT', 'FREE');
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'READY_FOR_COURIER', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED', 'LOST', 'DAMAGED');
CREATE TYPE "ShipmentSelectionMethod" AS ENUM ('AUTO_SELECTED', 'CUSTOMER_SELECTED', 'CUSTOM_CONTACT_REQUIRED');

ALTER TABLE "order_items"
  ADD COLUMN "shippingPointSource" "ShippingPointSource",
  ADD COLUMN "shippingPointsPerUnit" INTEGER;

ALTER TABLE "orders"
  ADD COLUMN "requiresCustomDelivery" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "product_variants"
  ADD COLUMN "shippingPointsOverride" INTEGER;

ALTER TABLE "products"
  ADD COLUMN "shippingPoints" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "products"
  ADD CONSTRAINT "products_shippingPoints_nonnegative" CHECK ("shippingPoints" >= 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_shippingPointsOverride_nonnegative"
  CHECK ("shippingPointsOverride" IS NULL OR "shippingPointsOverride" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_shippingPointsPerUnit_nonnegative"
  CHECK ("shippingPointsPerUnit" IS NULL OR "shippingPointsPerUnit" >= 0);

CREATE TABLE "couriers" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_locations" (
  "id" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "provinceNormalized" TEXT NOT NULL,
  "town" TEXT NOT NULL,
  "townNormalized" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "delivery_locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_zones" (
  "id" TEXT NOT NULL,
  "courierId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_zone_locations" (
  "zoneId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  CONSTRAINT "delivery_zone_locations_pkey" PRIMARY KEY ("zoneId", "locationId")
);

CREATE TABLE "package_tiers" (
  "id" TEXT NOT NULL,
  "courierId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minPoints" INTEGER,
  "maxPoints" INTEGER,
  "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "package_tiers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "package_tiers_valid_bounds" CHECK (
    ("isCustom" AND "minPoints" IS NULL AND "maxPoints" IS NULL)
    OR
    (NOT "isCustom" AND "minPoints" IS NOT NULL AND "maxPoints" IS NOT NULL
      AND "minPoints" >= 0 AND "minPoints" <= "maxPoints")
  )
);

CREATE TABLE "shipping_rates" (
  "id" TEXT NOT NULL,
  "deliveryZoneId" TEXT NOT NULL,
  "packageTierId" TEXT NOT NULL,
  "courierCost" DECIMAL(10,2) NOT NULL,
  "customerPriceStrategy" "ShippingPriceStrategy" NOT NULL,
  "customerPriceValue" DECIMAL(10,2),
  "currencyCode" TEXT NOT NULL DEFAULT 'ZMW',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipping_rates_courierCost_nonnegative" CHECK ("courierCost" >= 0),
  CONSTRAINT "shipping_rates_customerPriceValue_nonnegative"
    CHECK ("customerPriceValue" IS NULL OR "customerPriceValue" >= 0)
);

CREATE TABLE "shipments" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "courierId" TEXT,
  "deliveryZoneId" TEXT,
  "packageTierId" TEXT,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
  "selectionMethod" "ShipmentSelectionMethod" NOT NULL,
  "shippingPoints" INTEGER NOT NULL,
  "customerShippingPrice" DECIMAL(10,2),
  "courierCost" DECIMAL(10,2),
  "currencyCode" TEXT NOT NULL DEFAULT 'ZMW',
  "trackingNumber" TEXT,
  "destinationCountryCode" TEXT NOT NULL,
  "destinationProvince" TEXT NOT NULL,
  "destinationTown" TEXT NOT NULL,
  "courierCodeSnapshot" TEXT,
  "courierNameSnapshot" TEXT,
  "zoneCodeSnapshot" TEXT,
  "zoneNameSnapshot" TEXT,
  "tierCodeSnapshot" TEXT,
  "tierNameSnapshot" TEXT,
  "tierMinPointsSnapshot" INTEGER,
  "tierMaxPointsSnapshot" INTEGER,
  "tierIsCustomSnapshot" BOOLEAN,
  "rateIdSnapshot" TEXT,
  "pricingStrategySnapshot" "ShippingPriceStrategy",
  "pricingValueSnapshot" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "collectedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipments_shippingPoints_nonnegative" CHECK ("shippingPoints" >= 0),
  CONSTRAINT "shipments_customerShippingPrice_nonnegative"
    CHECK ("customerShippingPrice" IS NULL OR "customerShippingPrice" >= 0),
  CONSTRAINT "shipments_courierCost_nonnegative"
    CHECK ("courierCost" IS NULL OR "courierCost" >= 0)
);

CREATE UNIQUE INDEX "couriers_code_key" ON "couriers"("code");
CREATE INDEX "couriers_isActive_idx" ON "couriers"("isActive");
CREATE INDEX "delivery_locations_countryCode_provinceNormalized_townNorma_idx"
  ON "delivery_locations"("countryCode", "provinceNormalized", "townNormalized");
CREATE UNIQUE INDEX "delivery_locations_countryCode_provinceNormalized_townNorma_key"
  ON "delivery_locations"("countryCode", "provinceNormalized", "townNormalized");
CREATE INDEX "delivery_zones_courierId_isActive_idx" ON "delivery_zones"("courierId", "isActive");
CREATE UNIQUE INDEX "delivery_zones_courierId_code_key" ON "delivery_zones"("courierId", "code");
CREATE INDEX "delivery_zone_locations_locationId_idx" ON "delivery_zone_locations"("locationId");
CREATE INDEX "package_tiers_courierId_isActive_position_idx"
  ON "package_tiers"("courierId", "isActive", "position");
CREATE UNIQUE INDEX "package_tiers_courierId_code_key" ON "package_tiers"("courierId", "code");
CREATE INDEX "shipping_rates_packageTierId_isActive_idx" ON "shipping_rates"("packageTierId", "isActive");
CREATE UNIQUE INDEX "shipping_rates_deliveryZoneId_packageTierId_key"
  ON "shipping_rates"("deliveryZoneId", "packageTierId");
CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX "shipments_status_createdAt_idx" ON "shipments"("status", "createdAt");
CREATE INDEX "shipments_courierId_status_idx" ON "shipments"("courierId", "status");
CREATE INDEX "shipments_trackingNumber_idx" ON "shipments"("trackingNumber");

ALTER TABLE "delivery_zones"
  ADD CONSTRAINT "delivery_zones_courierId_fkey"
  FOREIGN KEY ("courierId") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_zone_locations"
  ADD CONSTRAINT "delivery_zone_locations_zoneId_fkey"
  FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "delivery_zone_locations"
  ADD CONSTRAINT "delivery_zone_locations_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "delivery_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "package_tiers"
  ADD CONSTRAINT "package_tiers_courierId_fkey"
  FOREIGN KEY ("courierId") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipping_rates"
  ADD CONSTRAINT "shipping_rates_deliveryZoneId_fkey"
  FOREIGN KEY ("deliveryZoneId") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipping_rates"
  ADD CONSTRAINT "shipping_rates_packageTierId_fkey"
  FOREIGN KEY ("packageTierId") REFERENCES "package_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_courierId_fkey"
  FOREIGN KEY ("courierId") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_deliveryZoneId_fkey"
  FOREIGN KEY ("deliveryZoneId") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_packageTierId_fkey"
  FOREIGN KEY ("packageTierId") REFERENCES "package_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
