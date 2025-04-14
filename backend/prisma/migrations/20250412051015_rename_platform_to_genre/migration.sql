/*
  Warnings:

  - You are about to drop the column `platform` on the `Game` table. All the data in the column will be lost.
  - Added the required column `genre` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "releaseDate" DATETIME,
    "purchaseDate" DATETIME,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("createdAt", "description", "id", "imageUrl", "name", "purchaseDate", "releaseDate", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "name", "purchaseDate", "releaseDate", "updatedAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
