-- CreateEnum
CREATE TYPE "ItineraryEventCategory" AS ENUM ('EXCURSION', 'MEAL', 'TRAVEL', 'CHECK_IN', 'CHECK_OUT', 'FREE_TIME', 'OTHER');

-- AlterEnum
ALTER TYPE "InngestJobType" ADD VALUE 'ITINERARY_GENERATION';

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "overview" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_days" (
    "id" TEXT NOT NULL,
    "itinerary_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "theme" TEXT,

    CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_events" (
    "id" TEXT NOT NULL,
    "itinerary_id" TEXT NOT NULL,
    "day_id" TEXT,
    "excursion_id" TEXT,
    "category" "ItineraryEventCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tips" TEXT,
    "location" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "timeLabel" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "backup_category" TEXT,
    "user_rating" INTEGER,
    "user_review" TEXT,
    "user_photo_urls" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_trip_id_key" ON "itineraries"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_days_itinerary_id_day_number_key" ON "itinerary_days"("itinerary_id", "day_number");

-- CreateIndex
CREATE INDEX "itinerary_events_day_id_idx" ON "itinerary_events"("day_id");

-- CreateIndex
CREATE INDEX "itinerary_events_itinerary_id_idx" ON "itinerary_events"("itinerary_id");

-- CreateIndex
CREATE INDEX "itinerary_events_excursion_id_idx" ON "itinerary_events"("excursion_id");

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "itinerary_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_excursion_id_fkey" FOREIGN KEY ("excursion_id") REFERENCES "excursions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
