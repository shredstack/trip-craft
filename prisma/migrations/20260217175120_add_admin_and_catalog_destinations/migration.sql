-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "catalog_destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score_beach" INTEGER NOT NULL DEFAULT 0,
    "score_adventure" INTEGER NOT NULL DEFAULT 0,
    "score_culture" INTEGER NOT NULL DEFAULT 0,
    "score_nature" INTEGER NOT NULL DEFAULT 0,
    "score_city" INTEGER NOT NULL DEFAULT 0,
    "score_resort" INTEGER NOT NULL DEFAULT 0,
    "score_theme_park" INTEGER NOT NULL DEFAULT 0,
    "score_cruise" INTEGER NOT NULL DEFAULT 0,
    "score_kid_friendly" INTEGER NOT NULL DEFAULT 0,
    "score_relaxation" INTEGER NOT NULL DEFAULT 0,
    "score_food" INTEGER NOT NULL DEFAULT 0,
    "score_safety" INTEGER NOT NULL DEFAULT 0,
    "score_scenic" INTEGER NOT NULL DEFAULT 0,
    "score_nightlife" INTEGER NOT NULL DEFAULT 0,
    "costTier" TEXT NOT NULL,
    "avg_daily_cost_usd" INTEGER NOT NULL,
    "best_months" TEXT NOT NULL,
    "avoid_months" TEXT,
    "min_recommended_age" INTEGER,
    "flight_time_nyc" DECIMAL(3,1),
    "flight_time_lax" DECIMAL(3,1),
    "flight_time_slc" DECIMAL(3,1),
    "flight_time_ord" DECIMAL(3,1),
    "flight_time_dfw" DECIMAL(3,1),
    "flight_time_mia" DECIMAL(3,1),
    "flight_time_atl" DECIMAL(3,1),
    "flight_time_sea" DECIMAL(3,1),
    "visa_required" BOOLEAN NOT NULL DEFAULT false,
    "visa_notes" TEXT,
    "language_notes" TEXT,
    "health_notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "place_id" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "avg_rating" DECIMAL(2,1),
    "review_count" INTEGER,
    "photo_urls" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generated_from" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_destinations_status_idx" ON "catalog_destinations"("status");

-- CreateIndex
CREATE INDEX "catalog_destinations_continent_idx" ON "catalog_destinations"("continent");

-- CreateIndex
CREATE INDEX "catalog_destinations_costTier_idx" ON "catalog_destinations"("costTier");

-- CreateIndex
CREATE INDEX "catalog_destinations_country_idx" ON "catalog_destinations"("country");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_destinations_name_country_key" ON "catalog_destinations"("name", "country");
