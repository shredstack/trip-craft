-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DREAMING', 'PLANNING', 'BOOKED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExcursionType" AS ENUM ('ADVENTURE', 'CULTURE', 'FOOD', 'NATURE', 'RELAXATION', 'NIGHTLIFE', 'SHOPPING', 'TRANSPORTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TripItemType" AS ENUM ('FLIGHT', 'HOTEL', 'CAR_RENTAL', 'TRANSFER', 'RESTAURANT', 'INSURANCE', 'DOCUMENT', 'PACKING', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('IDEA', 'RESEARCHING', 'BOOKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "depart_city" TEXT DEFAULT 'Salt Lake City, UT',
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'DREAMING',
    "criteria" JSONB,
    "depart_city" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget_type" TEXT,
    "total_budget" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT,
    "description" TEXT,
    "match_score" INTEGER,
    "ai_reasoning" TEXT,
    "place_id" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "avg_rating" DECIMAL(2,1),
    "review_count" INTEGER,
    "photo_urls" JSONB,
    "flight_time" TEXT,
    "avg_cost_pp" DECIMAL(10,2),
    "best_months" TEXT,
    "weather_data" JSONB,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,
    "user_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excursions" (
    "id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ExcursionType" NOT NULL,
    "price_estimate" TEXT,
    "price_cents" INTEGER,
    "duration" TEXT,
    "kid_friendly" BOOLEAN NOT NULL DEFAULT true,
    "min_age" INTEGER,
    "kid_notes" TEXT,
    "place_id" TEXT,
    "booking_url" TEXT,
    "avg_rating" DECIMAL(2,1),
    "review_count" INTEGER,
    "photo_urls" JSONB,
    "ai_reasoning" TEXT,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "user_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "excursions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_items" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "type" "TripItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'IDEA',
    "booking_ref" TEXT,
    "booking_url" TEXT,
    "provider" TEXT,
    "cost_cents" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "metadata" JSONB,
    "user_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "trips_user_id_idx" ON "trips"("user_id");

-- CreateIndex
CREATE INDEX "trips_status_idx" ON "trips"("status");

-- CreateIndex
CREATE INDEX "destinations_trip_id_idx" ON "destinations"("trip_id");

-- CreateIndex
CREATE INDEX "excursions_destination_id_idx" ON "excursions"("destination_id");

-- CreateIndex
CREATE INDEX "excursions_type_idx" ON "excursions"("type");

-- CreateIndex
CREATE INDEX "trip_items_trip_id_idx" ON "trip_items"("trip_id");

-- CreateIndex
CREATE INDEX "trip_items_type_idx" ON "trip_items"("type");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excursions" ADD CONSTRAINT "excursions_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
