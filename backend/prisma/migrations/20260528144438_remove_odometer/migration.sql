-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShiftSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "odometerStart" REAL,
    "odometerEnd" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startFullCylinders" INTEGER NOT NULL,
    "startEmptyCylinders" INTEGER NOT NULL DEFAULT 0,
    "endFullCylinders" INTEGER,
    "endEmptyCylinders" INTEGER,
    "endDamagedCylinders" INTEGER,
    "expectedCash" REAL NOT NULL DEFAULT 0.0,
    "physicalCashCollected" REAL,
    "cashVariance" REAL,
    "reconciledById" TEXT,
    "reconciliationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShiftSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShiftSession_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ShiftSession" ("cashVariance", "createdAt", "driverId", "endDamagedCylinders", "endEmptyCylinders", "endFullCylinders", "expectedCash", "id", "odometerEnd", "odometerStart", "physicalCashCollected", "reconciledById", "reconciliationNotes", "startEmptyCylinders", "startFullCylinders", "status", "tenantId", "truckId", "updatedAt") SELECT "cashVariance", "createdAt", "driverId", "endDamagedCylinders", "endEmptyCylinders", "endFullCylinders", "expectedCash", "id", "odometerEnd", "odometerStart", "physicalCashCollected", "reconciledById", "reconciliationNotes", "startEmptyCylinders", "startFullCylinders", "status", "tenantId", "truckId", "updatedAt" FROM "ShiftSession";
DROP TABLE "ShiftSession";
ALTER TABLE "new_ShiftSession" RENAME TO "ShiftSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
