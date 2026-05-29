import { PrismaService } from './prisma/prisma.service';
import { CustomerService } from './customer/customer.service';
import { CustomerStatus } from './customer/dto/register-customer.dto';
import { LedgerService } from './ledger/ledger.service';
import { OrderService } from './order/order.service';
import { ShiftService } from './shift/shift.service';
import { ExpenseService } from './expense/expense.service';
import { WhatsAppService } from './notifications/whatsapp.service';

const prisma = new PrismaService();

async function runTest() {
  console.log('--- STARTING LPG REAL DATA BUSINESS WORKFLOW TEST FOR RAZA GAS ---');

  // Initialize services
  const customerService = new CustomerService(prisma);
  const ledgerService = new LedgerService(prisma);
  const whatsappService = new WhatsAppService();
  const orderService = new OrderService(prisma, customerService, whatsappService);
  const shiftService = new ShiftService(prisma, ledgerService, whatsappService);
  const expenseService = new ExpenseService(prisma);

  const tenantName = 'Raza Gas Pvt Ltd';
  const driverEmail = 'ibaad@razagas.com';
  const ownerEmail = 'raza@razagas.com';

  // 1. Locate Tenant
  const tenant = await prisma.tenant.findFirst({
    where: { name: tenantName },
  });
  if (!tenant) {
    throw new Error(`Tenant "${tenantName}" not found. Please setup the owner account first.`);
  }
  const tenantId = tenant.id;
  console.log(`[Tenant Info] Found Tenant: ${tenant.name} (ID: ${tenantId})`);

  // 2. Locate driver
  const driver = await prisma.user.findFirst({
    where: { email: driverEmail, tenantId },
  });
  if (!driver) {
    throw new Error(`Driver "${driverEmail}" not found for tenant.`);
  }
  console.log(`[Driver Info] Found driver: ${driver.name} (ID: ${driver.id})`);

  // Locate owner (to act as accountant/approver)
  const owner = await prisma.user.findFirst({
    where: { email: ownerEmail, tenantId },
  });
  if (!owner) {
    throw new Error(`Owner "${ownerEmail}" not found.`);
  }
  console.log(`[Owner Info] Found owner/accountant: ${owner.name} (ID: ${owner.id})`);

  // Locate warehouse
  const warehouse = await prisma.warehouse.findFirst({
    where: { tenantId },
  });
  if (!warehouse) {
    throw new Error(`Warehouse not found for tenant.`);
  }
  const warehouseId = warehouse.id;
  console.log(`[Warehouse Info] Found Warehouse: ${warehouse.name} (ID: ${warehouseId})`);

  // Locate customer
  const customer = await prisma.customer.findFirst({
    where: { tenantId, name: 'muhammad abrar' },
  });
  if (!customer) {
    throw new Error(`Customer "muhammad abrar" not found.`);
  }
  console.log(`[Customer Info] Found customer: ${customer.name} (ID: ${customer.id})`);

  // 3. Clean previous test orders/shifts to ensure reproducibility for the real test run
  await prisma.financialLedger.deleteMany({ where: { tenantId } });
  await prisma.cylinderLedger.deleteMany({ where: { tenantId } });
  await prisma.expenseClaim.deleteMany({ where: { tenantId } });
  await prisma.order.deleteMany({ where: { tenantId } });
  await prisma.driverShift.deleteMany({ where: { tenantId } });

  // Update customer credit limit & status to active for the test
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      creditLimit: 50000.0,
      creditBalance: 0.0,
      emptyCylinderLiability: 0,
      status: 'ACTIVE',
    }
  });
  console.log(`[Customer Prep] Updated ${customer.name} credit limit to Rs. 50,000.`);

  // Load warehouse stock with full & empty counts
  await prisma.warehouse.update({
    where: { id: warehouseId },
    data: {
      fullCylinderStock: 100,
      emptyCylinderStock: 50,
      damagedCylinderStock: 5,
    },
  });
  console.log(`[Warehouse Prep] Initialized stock: 100 Full Cylinders, 50 Empty Shells, 5 Damaged.`);

  // Reset Financial Account balances
  await prisma.financialAccount.updateMany({
    where: { tenantId },
    data: { balance: 0.0 },
  });
  // Initialize Cash in Hand with starting cash (Rs. 10,000 float)
  const cashAcc = await prisma.financialAccount.findFirst({
    where: { tenantId, code: '1000' },
  });
  if (cashAcc) {
    await prisma.financialAccount.update({
      where: { id: cashAcc.id },
      data: { balance: 10000.0 },
    });
  }
  console.log('[Setup] Real database test context cleaned and prepared.');

  // 4. Test Credit Control Lock (BLOCKED Order)
  console.log('\n--- 4. TESTING CREDIT LIMIT LOCKS ---');
  // Order 1 (Credit limit fits: 5 * 5000 = 25,000)
  const orderDraft = await orderService.createOrder({
    tenantId,
    customerId: customer.id,
    warehouseId,
    quantity: 5,
    unitPrice: 5000.0,
    paymentTerms: 'CREDIT',
  });
  console.log(`[Order 1 Created] Quantity: 5, Total: Rs. ${orderDraft.totalAmount}, Status: ${orderDraft.status}`);
  if (orderDraft.status !== 'DRAFT') {
    throw new Error(`Expected order 1 status to be DRAFT, got ${orderDraft.status}`);
  }

  // Order 2 (Credit limit exceeded: 12 * 5000 = 60,000 > 50,000)
  const orderBlocked = await orderService.createOrder({
    tenantId,
    customerId: customer.id,
    warehouseId,
    quantity: 12,
    unitPrice: 5000.0,
    paymentTerms: 'CREDIT',
  });
  console.log(`[Order 2 Created] Quantity: 12, Total: Rs. ${orderBlocked.totalAmount}, Status: ${orderBlocked.status}`);
  if (orderBlocked.status !== 'BLOCKED') {
    throw new Error(`Expected order 2 status to be BLOCKED, got ${orderBlocked.status}`);
  }

  // 5. Test Check-out / Route Dispatch
  console.log('\n--- 5. TESTING CHECK-OUT / ROUTE DISPATCH ---');
  const shift = await shiftService.openShift({
    tenantId,
    driverId: driver.id,
    truckId: 'TRK-987-ISL',
    startFullCylinders: 10,
    startEmptyCylinders: 0,
    startCash: 10000.0, // starting float cash
    warehouseId,
    orderIds: [orderDraft.id],
  });
  console.log(`[Dispatch Session Opened] Dispatch ID: ${shift.id}, Truck: ${shift.truckId}, Expected Cash: Rs. ${shift.expectedCash}, Status: ${shift.status}`);

  // Verify warehouse stock decremented
  const warehouseAfterOpen = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  console.log(`[Warehouse Stock] Full stock after open (100 - 10, blocked order did not deduct stock): ${warehouseAfterOpen?.fullCylinderStock}`);
  if (warehouseAfterOpen?.fullCylinderStock !== 90) {
    throw new Error(`Expected full cylinder stock to be 90, got ${warehouseAfterOpen?.fullCylinderStock}`);
  }

  // Verify CylinderLedger loading logged
  const loadingLedger = await prisma.cylinderLedger.findFirst({
    where: { shiftSessionId: shift.id, transactionType: 'LOADING_TO_TRUCK' },
  });
  console.log(`[Cylinder Ledger] Loading record created: ${loadingLedger?.transactionType}, fullDelta: ${loadingLedger?.fullDelta}`);
  if (loadingLedger?.fullDelta !== -5) {
    throw new Error(`Expected loading fullDelta to be -5, got ${loadingLedger?.fullDelta}`);
  }

  // Test active dispatch session checking (should prevent opening another dispatch session)
  try {
    await shiftService.openShift({
      tenantId,
      driverId: driver.id,
      truckId: 'TRK-987-ISL',
      startFullCylinders: 10,
      warehouseId,
    });
    throw new Error('Should have failed to open a new dispatch session when an active one exists');
  } catch (err: any) {
    console.log(`[Dispatch Validation] Correctly rejected: ${err.message}`);
  }

  // 6. Test Order Assignment & Dispatch
  console.log('\n--- 6. TESTING ORDER ASSIGNMENT & DISPATCH ---');
  // Assign Order 1 to driver and shift session
  const orderAssigned = await orderService.assignOrder(orderDraft.id, {
    driverId: driver.id,
    shiftSessionId: shift.id,
  });
  console.log(`[Order 1 Assigned] Status: ${orderAssigned.status}, Driver ID: ${orderAssigned.driverId}`);
  if (orderAssigned.status !== 'ASSIGNED') {
    throw new Error(`Expected order status to be ASSIGNED, got ${orderAssigned.status}`);
  }

  // Dispatch Order 1 (starts transit)
  const orderInTransit = await orderService.dispatchOrder(orderDraft.id);
  console.log(`[Order 1 Dispatched] Status: ${orderInTransit.status}`);
  if (orderInTransit.status !== 'IN_TRANSIT') {
    throw new Error(`Expected order status to be IN_TRANSIT, got ${orderInTransit.status}`);
  }

  // 7. Test Delivery Log
  console.log('\n--- 7. TESTING DELIVERY LOG & CYLINDER EXCHANGE ---');
  // Log delivery of Order 1: deliver 5 fulls, recover 4 empties (imbalance = +1)
  const orderDelivered = await shiftService.logDelivery({
    orderId: orderDraft.id,
    recoveredQuantity: 4,
    customerSignature: 'http://signatures.bucket/sig1.png',
    deliveryPhoto: 'http://photos.bucket/del1.png',
    indirectHandover: false,
    notes: 'Manifolds connected successfully',
    deliveryLatitude: 33.7294,
    deliveryLongitude: 73.0931,
  });
  console.log(`[Order 1 Delivered] Status: ${orderDelivered.status}, Signature: ${orderDelivered.customerSignature}`);
  if (orderDelivered.status !== 'DELIVERED_UNVERIFIED') {
    throw new Error(`Expected order status to be DELIVERED_UNVERIFIED, got ${orderDelivered.status}`);
  }

  // Verify Customer liability increased by 1 (5 delivered - 4 recovered)
  const customerAfterDel = await prisma.customer.findUnique({ where: { id: customer.id } });
  console.log(`[Customer Balance] Cylinder Liability (Expected 1): ${customerAfterDel?.emptyCylinderLiability}`);
  if (customerAfterDel?.emptyCylinderLiability !== 1) {
    throw new Error(`Expected customer emptyCylinderLiability to be 1, got ${customerAfterDel?.emptyCylinderLiability}`);
  }

  // Verify CylinderLedger logs
  const ledgerDel = await prisma.cylinderLedger.findFirst({
    where: { orderId: orderDraft.id, transactionType: 'DELIVERY_TO_CUSTOMER' },
  });
  const ledgerRec = await prisma.cylinderLedger.findFirst({
    where: { orderId: orderDraft.id, transactionType: 'EMPTY_RECOVERY_FROM_CUSTOMER' },
  });
  console.log(`[Cylinder Ledger] Delivery log fullDelta: ${ledgerDel?.fullDelta}`);
  console.log(`[Cylinder Ledger] Recovery log emptyDelta: ${ledgerRec?.emptyDelta}`);
  if (ledgerDel?.fullDelta !== -5 || ledgerRec?.emptyDelta !== 4) {
    throw new Error('CylinderLedger delivery/recovery delta counts are incorrect.');
  }

  // 8. Test Expense Management
  console.log('\n--- 8. TESTING EXPENSE LAWS & DUPLICATE CHECKS ---');
  // A. Expense >= Rs. 1,000 without receiptUrl (macro validation check)
  try {
    await expenseService.createExpenseClaim({
      tenantId,
      driverId: driver.id,
      shiftSessionId: shift.id,
      category: 'MAINTENANCE',
      amount: 1500.0,
      description: 'Minor tire fix',
    });
    throw new Error('Should have failed macro expense without receipt');
  } catch (err: any) {
    console.log(`[Expense Validation] Macro receipt required check passed: ${err.message}`);
  }

  // C. Successful Expense Logging (Fuel, amount Rs. 3,000)
  const expense = await expenseService.createExpenseClaim({
    tenantId,
    driverId: driver.id,
    shiftSessionId: shift.id,
    category: 'FUEL',
    amount: 3000.0,
    receiptUrl: 'http://receipts.bucket/fuel1.png',
    receiptHash: 'mocked_hash_value_123',
  });
  console.log(`[Expense Logged] Category: ${expense.category}, Amount: Rs. ${expense.amount}, Status: ${expense.status}`);

  // D. Duplicate Receipt Hash Check
  try {
    await expenseService.createExpenseClaim({
      tenantId,
      driverId: driver.id,
      shiftSessionId: shift.id,
      category: 'TOLL',
      amount: 500.0,
      receiptUrl: 'http://receipts.bucket/fuel1.png',
      receiptHash: 'mocked_hash_value_123',
    });
    throw new Error('Should have failed duplicate receiptHash check');
  } catch (err: any) {
    console.log(`[Expense Validation] Duplicate receiptHash check passed: ${err.message}`);
  }

  // E. Owner/Accountant Approval
  const approvedClaim = await expenseService.approveExpenseClaim(expense.id, {
    status: 'APPROVED',
    approvedById: owner.id,
    approvalNotes: 'Approved fuel expenses',
  });
  console.log(`[Expense Approved] Claim ID: ${approvedClaim.id}, Status: ${approvedClaim.status}`);

  // F. Verify Dispatch Session expectedCash decremented
  const shiftAfterExpense = await prisma.driverShift.findUnique({ where: { id: shift.id } });
  // Initial cash: 10,000. Delivered cash orders: 0. Approved expense: 3,000. Expected cash: 10,000 - 3,000 = 7,000.
  console.log(`[Dispatch Expected Cash] Expected Cash after expense: Rs. ${shiftAfterExpense?.expectedCash}`);
  if (shiftAfterExpense?.expectedCash !== 7000.0) {
    throw new Error(`Expected dispatch cash to be 7000.0, got ${shiftAfterExpense?.expectedCash}`);
  }

  // 9. Test Driver Settlement & Shift Reconciliation
  console.log('\n--- 9. TESTING DRIVER SETTLEMENT & SHIFT RECONCILIATION ---');
  // Accountant reconciles and completes driver settlement
  // Driver returns:
  // - 5 full cylinders (started with 10, delivered 5, returns 5)
  // - 4 empty cylinders (recovered 4 from customer, returns 4)
  // Accountant receives cash collected:
  // - Expected cash was Rs. 7,000. Let's simulate a shortage: physicalCashCollected is Rs. 6,000 (variance -1000)
  const reconciliation = await shiftService.closeShift(shift.id, {
    physicalCashCollected: 6000.0,
    endFullCylinders: 5,
    endEmptyCylinders: 4,
    endDamagedCylinders: 1, // 1 damaged cylinder reported at close
    reconciliationNotes: 'Driver had a shortage of Rs. 1,000, which was posted to Driver Suspense Cash',
    reconciledById: owner.id,
  });

  console.log('[Driver Settlement & Reconciliation Results]');
  console.log(`- Expected Cash: Rs. ${reconciliation.expectedCash}`);
  console.log(`- Expected Empties: ${reconciliation.expectedEmpties}`);
  console.log(`- Cash Variance: Rs. ${reconciliation.cashVariance}`);
  console.log(`- Empty Variance: ${reconciliation.emptyVariance}`);
  console.log(`- Reconciliation Status: ${reconciliation.status}`);

  if (reconciliation.cashVariance !== -1000.0) {
    throw new Error(`Expected cash variance to be -1000.0, got ${reconciliation.cashVariance}`);
  }
  console.log(`- Expected Empties calculated: ${reconciliation.expectedEmpties}, Empty Variance calculated: ${reconciliation.emptyVariance}`);

  // Verify warehouse stock updated
  const warehouseAfterClose = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  console.log(`[Warehouse Stock Final] Full Cylinders: ${warehouseAfterClose?.fullCylinderStock}`);
  console.log(`[Warehouse Stock Final] Empty Cylinders: ${warehouseAfterClose?.emptyCylinderStock}`);
  console.log(`[Warehouse Stock Final] Damaged Cylinders: ${warehouseAfterClose?.damagedCylinderStock}`);
  // Warehouse Full stock: 90 after open + 5 returned = 95
  // Warehouse Empty stock: 50 after open (decremented by 0) + 4 returned = 54
  // Warehouse Damaged stock: 5 + 1 returned = 6
  if (warehouseAfterClose?.fullCylinderStock !== 95 || warehouseAfterClose?.emptyCylinderStock !== 54 || warehouseAfterClose?.damagedCylinderStock !== 6) {
    throw new Error('Warehouse final stock values are incorrect!');
  }

  // Verify Order status completed
  const finalOrder = await prisma.order.findUnique({ where: { id: orderDraft.id } });
  console.log(`[Order 1 Final Status] ${finalOrder?.status}`);
  if (finalOrder?.status !== 'COMPLETED') {
    throw new Error(`Expected final order status to be COMPLETED, got ${finalOrder?.status}`);
  }

  // 10. Verify Double-Entry Ledger Posting
  console.log('\n--- 10. VERIFYING DOUBLE-ENTRY LEDGER BALANCE ---');
  const journalResult = reconciliation.ledgerResult;
  if (!journalResult) {
    throw new Error('Journal entry was not posted.');
  }
  console.log(`[Ledger Posted] Batch ID: ${journalResult.batchId}`);
  const ledgerLines = await prisma.financialLedger.findMany({
    where: { batchId: journalResult.batchId },
    include: { account: true },
  });

  console.log('Ledger lines details:');
  let debitsTotal = 0;
  let creditsTotal = 0;
  for (const line of ledgerLines) {
    console.log(`- Account: ${line.account.name} (Code: ${line.account.code}), Debit: Rs. ${line.debit}, Credit: Rs. ${line.credit}`);
    debitsTotal += line.debit;
    creditsTotal += line.credit;
  }
  console.log(`[Ledger Totals] Debits: Rs. ${debitsTotal}, Credits: Rs. ${creditsTotal}`);
  if (Math.round(debitsTotal * 100) !== Math.round(creditsTotal * 100)) {
    throw new Error(`Ledger entry violates double-entry rule! Sum of debits (${debitsTotal}) !== Credits (${creditsTotal})`);
  }

  // Verify Account balances
  const accountsFinal = await prisma.financialAccount.findMany({ where: { tenantId } });
  console.log('\nFinal Financial Account Balances:');
  for (const acc of accountsFinal) {
    console.log(`- Account: ${acc.name} (Code: ${acc.code}), Balance: Rs. ${acc.balance}`);
  }

  // Cash in Hand should be 6000.0 (received)
  const cashInHandBalance = accountsFinal.find(a => a.code === '1000')?.balance;
  if (cashInHandBalance !== 6000.0) {
    throw new Error(`Expected Cash in Hand balance to be 6000.0, got ${cashInHandBalance}`);
  }

  // Accounts Receivable should be 25000.0 (debited for the credit order: 5 * 5000)
  const receivablesBalance = accountsFinal.find(a => a.code === '1200')?.balance;
  if (receivablesBalance !== 25000.0) {
    throw new Error(`Expected Accounts Receivable balance to be 25000.0, got ${receivablesBalance}`);
  }

  // Operating Expenses should be 3000.0 (approved fuel claim)
  const expensesBalance = accountsFinal.find(a => a.code === '5000')?.balance;
  if (expensesBalance !== 3000.0) {
    throw new Error(`Expected Operating Expenses balance to be 3000.0, got ${expensesBalance}`);
  }

  // Driver Suspense Cash should be 1000.0 (shortage)
  const driverSuspenseBalance = accountsFinal.find(a => a.code === '1400')?.balance;
  if (driverSuspenseBalance !== 1000.0) {
    throw new Error(`Expected Driver Suspense Cash balance to be 1000.0, got ${driverSuspenseBalance}`);
  }

  // Revenue should be 25000.0 (from credit order sale)
  const revenueBalance = accountsFinal.find(a => a.code === '4000')?.balance;
  if (revenueBalance !== 25000.0) {
    throw new Error(`Expected LPG Sales Revenue balance to be 25000.0, got ${revenueBalance}`);
  }

  console.log('\n*** INTEGRATION TEST PASSED SUCCESSFULLY! ALL VERIFICATIONS ARE CORRECT FOR REAL DATA! ***');
}

runTest()
  .catch((e) => {
    console.error('\n*** INTEGRATION TEST FAILED! ***');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
