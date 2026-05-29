-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "driverId" TEXT,
    "shiftSessionId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deliveryLatitude" REAL,
    "deliveryLongitude" REAL,
    "geofenceViolated" BOOLEAN NOT NULL DEFAULT false,
    "geofenceDistance" REAL,
    "deliveredAt" DATETIME,
    "customerSignature" TEXT,
    "deliveryPhoto" TEXT,
    "indirectHandover" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "ShiftSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "customerSignature", "deliveredAt", "deliveryLatitude", "deliveryLongitude", "deliveryPhoto", "driverId", "id", "indirectHandover", "notes", "paymentStatus", "paymentTerms", "quantity", "shiftSessionId", "status", "tenantId", "totalAmount", "unitPrice", "updatedAt", "warehouseId") SELECT "createdAt", "customerId", "customerSignature", "deliveredAt", "deliveryLatitude", "deliveryLongitude", "deliveryPhoto", "driverId", "id", "indirectHandover", "notes", "paymentStatus", "paymentTerms", "quantity", "shiftSessionId", "status", "tenantId", "totalAmount", "unitPrice", "updatedAt", "warehouseId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
