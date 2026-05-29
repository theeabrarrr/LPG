-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "pin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "creditLimit" REAL NOT NULL DEFAULT 0.0,
    "creditBalance" REAL NOT NULL DEFAULT 0.0,
    "emptyCylinderLiability" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "fullCylinderStock" INTEGER NOT NULL DEFAULT 0,
    "emptyCylinderStock" INTEGER NOT NULL DEFAULT 0,
    "damagedCylinderStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
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

-- CreateTable
CREATE TABLE "ShiftSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "odometerStart" REAL NOT NULL,
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

-- CreateTable
CREATE TABLE "CylinderLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "customerId" TEXT,
    "driverId" TEXT,
    "shiftSessionId" TEXT,
    "orderId" TEXT,
    "fullDelta" INTEGER NOT NULL DEFAULT 0,
    "emptyDelta" INTEGER NOT NULL DEFAULT 0,
    "damagedDelta" INTEGER NOT NULL DEFAULT 0,
    "transactionType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CylinderLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CylinderLedger_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CylinderLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CylinderLedger_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CylinderLedger_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "ShiftSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CylinderLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0.0,
    "credit" REAL NOT NULL DEFAULT 0.0,
    "customerId" TEXT,
    "userId" TEXT,
    "shiftSessionId" TEXT,
    "orderId" TEXT,
    "expenseClaimId" TEXT,
    "description" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "ShiftSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialLedger_expenseClaimId_fkey" FOREIGN KEY ("expenseClaimId") REFERENCES "ExpenseClaim" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "shiftSessionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "receiptHash" TEXT,
    "odometer" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_APPROVAL',
    "approvedById" TEXT,
    "approvalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpenseClaim_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpenseClaim_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpenseClaim_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "ShiftSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpenseClaim_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "preState" TEXT,
    "postState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_tenantId_code_key" ON "FinancialAccount"("tenantId", "code");
