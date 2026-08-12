-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Programme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "targetPopulation" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "budget" REAL NOT NULL,
    "objectives" TEXT NOT NULL,
    "activities" TEXT NOT NULL,
    "outputs" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "partners" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "generatorSource" TEXT NOT NULL DEFAULT 'SEED',
    "customFields" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Programme_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Programme" ("activities", "budget", "code", "createdAt", "description", "endDate", "generatorSource", "geography", "id", "impact", "name", "objectives", "organisationId", "outcomes", "outputs", "partners", "problemStatement", "reviewStatus", "startDate", "status", "targetPopulation", "updatedAt") SELECT "activities", "budget", "code", "createdAt", "description", "endDate", "generatorSource", "geography", "id", "impact", "name", "objectives", "organisationId", "outcomes", "outputs", "partners", "problemStatement", "reviewStatus", "startDate", "status", "targetPopulation", "updatedAt" FROM "Programme";
DROP TABLE "Programme";
ALTER TABLE "new_Programme" RENAME TO "Programme";
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
