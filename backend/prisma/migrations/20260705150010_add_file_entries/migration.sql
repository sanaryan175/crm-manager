-- CreateTable
CREATE TABLE "file_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "folder" TEXT NOT NULL DEFAULT '/',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_entries_organization_id_name_key" ON "file_entries"("organization_id", "name");

-- AddForeignKey
ALTER TABLE "file_entries" ADD CONSTRAINT "file_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_entries" ADD CONSTRAINT "file_entries_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
