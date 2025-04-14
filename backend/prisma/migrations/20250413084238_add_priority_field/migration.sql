-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'high',
    "gameId" INTEGER NOT NULL,
    "puzzleId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "description", "gameId", "id", "puzzleId", "reportDate", "resolution", "resolvedAt", "status", "title", "updatedAt") SELECT "createdAt", "description", "gameId", "id", "puzzleId", "reportDate", "resolution", "resolvedAt", "status", "title", "updatedAt" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE INDEX "Report_gameId_idx" ON "Report"("gameId");
CREATE INDEX "Report_puzzleId_idx" ON "Report"("puzzleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
