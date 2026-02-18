-- CreateEnum
CREATE TYPE "InngestJobType" AS ENUM ('TRIP_GENERATION', 'CATALOG_GENERATION');

-- CreateEnum
CREATE TYPE "InngestJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "catalog_generation_jobs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "results" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inngest_jobs" (
    "id" TEXT NOT NULL,
    "type" "InngestJobType" NOT NULL,
    "status" "InngestJobStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "trip_id" TEXT,
    "inngest_event_id" TEXT,
    "llm_prompt" TEXT,
    "llm_model" TEXT,
    "total_input_tokens" INTEGER,
    "total_output_tokens" INTEGER,
    "duration_ms" INTEGER,
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inngest_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inngest_job_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "step_name" TEXT,
    "message" TEXT,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "duration_ms" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inngest_job_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inngest_jobs_type_idx" ON "inngest_jobs"("type");

-- CreateIndex
CREATE INDEX "inngest_jobs_status_idx" ON "inngest_jobs"("status");

-- CreateIndex
CREATE INDEX "inngest_jobs_user_id_idx" ON "inngest_jobs"("user_id");

-- CreateIndex
CREATE INDEX "inngest_jobs_trip_id_idx" ON "inngest_jobs"("trip_id");

-- CreateIndex
CREATE INDEX "inngest_jobs_created_at_idx" ON "inngest_jobs"("created_at");

-- CreateIndex
CREATE INDEX "inngest_job_events_job_id_idx" ON "inngest_job_events"("job_id");

-- CreateIndex
CREATE INDEX "inngest_job_events_status_idx" ON "inngest_job_events"("status");

-- CreateIndex
CREATE INDEX "inngest_job_events_created_at_idx" ON "inngest_job_events"("created_at");

-- AddForeignKey
ALTER TABLE "inngest_jobs" ADD CONSTRAINT "inngest_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inngest_job_events" ADD CONSTRAINT "inngest_job_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "inngest_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
