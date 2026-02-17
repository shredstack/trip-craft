-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "reviews" JSONB;

-- AlterTable
ALTER TABLE "excursions" ADD COLUMN     "reviews" JSONB;

-- CreateTable
CREATE TABLE "accommodations" (
    "id" TEXT NOT NULL,
    "destination_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "place_id" TEXT,
    "avg_rating" DECIMAL(2,1),
    "review_count" INTEGER,
    "photo_urls" JSONB,
    "price_level" INTEGER,
    "formatted_address" TEXT,
    "website_url" TEXT,
    "reviews" JSONB,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accommodations_destination_id_idx" ON "accommodations"("destination_id");

-- AddForeignKey
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
