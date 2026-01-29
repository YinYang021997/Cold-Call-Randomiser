/*
  Warnings:

  - Added the required column `userId` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classroom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timing" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("classroom", "code", "createdAt", "dates", "id", "name", "status", "timing", "updatedAt") SELECT "classroom", "code", "createdAt", "dates", "id", "name", "status", "timing", "updatedAt" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
CREATE INDEX "Class_userId_idx" ON "Class"("userId");
CREATE INDEX "Class_status_idx" ON "Class"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
