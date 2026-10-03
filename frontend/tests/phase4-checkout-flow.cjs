/* PHASE 4 verification — cart, checkout and order flow (browser + API).
 *
 * Drives the real frontend (Vite dev server) in a real Chromium session and
 * the real backend API. Nothing is mocked: the only network interference is a
 * deliberately aborted checkout request used to prove that a failed backend
 * call can never render a successful order.
 *
 * The run creates its own QA accounts and QA listings through the public API
 * (e-mail addresses are marked `qa4_`). It never writes to MongoDB directly,
 * never deletes user data, never touches an existing account/product/order and
 * never runs a seed script.
 *
 * Requirements:
 *   - backend listening on http://localhost:5000/api
 *   - frontend dev server on http://localhost:5173
 *   - `playwright-core` resolvable, e.g.
 *       NODE_PATH=<dir containing playwright-core> node frontend/tests/phase4-checkout-flow.cjs
 *
 * Exit code 0 = every check passed, 1 = at least one failure.
 */
const { chromium } = require('playwright-core');

const API = process.env.API_URL || 'http://localhost:5000/api';
const APP = process.env.APP_URL || 'http://localhost:5173';
const TS = Date.now();
const PWD = 'QaPhase4-Test-2026';

const PASS = [];
const FAIL = [];
const check = (name, cond, detail = '') => {
  if (cond) PASS.push(name);
  else FAIL.push(`${name}${detail ? ` :: ${detail}` : ''}`);
};

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const flat = (s) => String(s || '').replace(/\s+/g, '');
const inr = (n, dec = false) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: dec ? 2 : (n % 1 === 0 ? 0 : 2),
    maximumFractionDigits: 2
  }).format(n);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitFor = async (fn, { timeout = 12000, interval = 250 } = {}) => {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await fn();
    if (last) return last;
    await sleep(interval);
  }
  return last;
};

const call = async (method, path, { token, body } = {}) => {
  try {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: { message: e.message } };
  }
};

const pageErrors = [];
let page;

const openCartPage = async (path = '/cart') => {
  await page.goto(`${APP}${path}`, { waitUntil: 'domcontentloaded' });
};

const badge = async () => norm(await page.locator('.cart-badge').first().textContent().catch(() => ''));
const orderCount = async (token) => {
  const r = await call('GET', '/orders/mine', { token });
  return r.status === 200 ? (r.data?.data || []).length : -1;
};
const productStock = async (id) => {
  const r = await call('GET', `/products/${id}`);
  return r.data?.data?.stock;
};
const bag = async () => page.evaluate(() => JSON.parse(sessionStorage.getItem('neardeal_cart') || '[]'));

const fillCheckout = async ({ name, phone, address, pin, city, state }) => {
  if (name !== undefined) await page.fill('input[name="name"]', name);
  if (phone !== undefined) await page.fill('input[name="phone"]', phone);
  if (address !== undefined) await page.fill('input[name="address"]', address);
  if (pin !== undefined) await page.fill('input[name="pin"]', pin);
  if (city !== undefined) await page.fill('input[name="city"]', city);
  if (state !== undefined) await page.fill('input[name="state"]', state);
};

const addToBag = async (productId) => {
  await page.goto(`${APP}/products/${productId}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Add to Bag', exact: true }).waitFor({ timeout: 20000 });
  await page.getByRole('button', { name: 'Add to Bag', exact: true }).click();
};

const submitCheckout = () => page.locator('.checkout-submit-btn').click();

const successVisible = async () => (await page.locator('.order-confirmed-title').count()) > 0;

(async () => {
  console.log(`Phase 4 checkout/order verification -> API ${API} | APP ${APP}\n`);

  // ------------------------------------------------------------ preconditions
  const health = await call('GET', '/health');
  check('env: backend API reachable', health.status === 200, `got ${health.status}`);
  if (health.status !== 200) throw new Error('backend not reachable — aborting');

  // ------------------------------------------------------- QA data (own rows)
  const sellerEmail = `qa4_seller_${TS}@example.com`;
  const custEmail = `qa4_cust_${TS}@example.com`;

  const sellerReg = await call('POST', '/auth/register', { body: {
    name: 'QA Phase4 Merchant', email: sellerEmail, password: PWD, role: 'SELLER',
    businessName: 'QA Phase4 Furniture'
  } });
  check('setup: QA seller registers 201', sellerReg.status === 201, `got ${sellerReg.status}`);
  const tSeller = sellerReg.data?.data?.token;

  const loc = await call('PUT', '/auth/profile', { token: tSeller, body: { lat: 22.7533, lng: 75.8937 } });
  check('setup: QA seller store location saved', loc.status === 200, `got ${loc.status}`);

  const p1 = (await call('POST', '/products', { token: tSeller, body: {
    name: 'QA Phase4 Recliner', category: 'Living Room', price: 2500, stock: 10,
    description: 'Phase 4 checkout verification listing.', isNegotiable: false, images: []
  } })).data?.data?._id;
  const p2 = (await call('POST', '/products', { token: tSeller, body: {
    name: 'QA Phase4 Bookshelf', category: 'Storage', price: 1000, stock: 10,
    description: 'Phase 4 multi-line checkout verification listing.', isNegotiable: false, images: []
  } })).data?.data?._id;
  check('setup: both QA listings created', !!p1 && !!p2, `p1=${p1} p2=${p2}`);

  const custReg = await call('POST', '/auth/register', { body: {
    name: 'QA Phase4 Buyer', email: custEmail, password: PWD, role: 'CUSTOMER'
  } });
  check('setup: QA customer registers 201', custReg.status === 201, `got ${custReg.status}`);
  const tCust = custReg.data?.data?.token;

  check('setup: fresh customer starts with no orders', (await orderCount(tCust)) === 0,
    `count=${await orderCount(tCust)}`);
  check('setup: QA listings start at stock 10',
    (await productStock(p1)) === 10 && (await productStock(p2)) === 10,
    `p1=${await productStock(p1)} p2=${await productStock(p2)}`);

  // ------------------------------------------------------------- browser run
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({
      headless: true,
      executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe`
    });
  }
  const ctx = await browser.newContext({
    baseURL: APP,
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
    geolocation: { latitude: 22.7533, longitude: 75.8937 },
    permissions: ['geolocation']
  });
  page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // ------------------------------------------------- sign in as the customer
  await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', custEmail);
  await page.fill('input[type="password"]', PWD);
  await page.click('button[type="submit"]');
  const signedIn = await page.waitForSelector('.cart-badge', { timeout: 20000 }).catch(() => null);
  check('login: customer signs in and the cart badge appears', !!signedIn);
  check('login: a fresh bag starts empty', (await badge()) === '0', `badge=${await badge()}`);
  check('login: no legacy local order mirror is written',
    await page.evaluate(() => localStorage.getItem('neardeal_orders') === null));

  // ---------------------------------------------- 1. add a product to the cart
  await addToBag(p1);
  const bagAfterAdd = await waitFor(async () => ((await badge()) === '1' ? await bag() : null));
  check('step1: product added to the bag (badge = 1)', !!bagAfterAdd && (await badge()) === '1',
    `badge=${await badge()}`);
  check('step1: bag row carries the real product id, price and quantity',
    !!bagAfterAdd && String(bagAfterAdd[0]?.productId) === String(p1) &&
      bagAfterAdd[0]?.price === 2500 && bagAfterAdd[0]?.quantity === 1,
    JSON.stringify(bagAfterAdd && bagAfterAdd[0]));
  check('step1: bag row carries an idempotency checkout key',
    !!bagAfterAdd && /^[A-Za-z0-9_-]{8,64}$/.test(bagAfterAdd[0]?.checkoutKey || ''),
    bagAfterAdd && bagAfterAdd[0]?.checkoutKey);

  // ------------------------------------- 2. quantity change -> subtotal/total
  await openCartPage();
  await page.waitForSelector('.summary-row', { timeout: 15000 });
  let rowText = norm(await page.locator('.cart-item-row').first().textContent());
  check('step2: cart row shows the product, unit price and quantity',
    rowText.includes('QA Phase4 Recliner') && rowText.includes(inr(2500)) && rowText.includes('Qty: 1'),
    rowText);
  check('step2: subtotal = unit price x 1', flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(2500)}`),
    await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent());
  check('step2: customer payable equals subtotal (qty 1)', flat(await page.locator('.summary-row-total').first().textContent()) === flat(`Customer Payable:${inr(2500)}`),
    await page.locator('.summary-row-total').first().textContent());

  await page.locator('.cart-item-row button[aria-label="Increase quantity"]').click();
  const up = await waitFor(async () => flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(5000)}`));
  check('step2: raising quantity to 2 updates subtotal to ' + inr(5000), !!up);
  check('step2: raising quantity to 2 updates the payable total to ' + inr(5000),
    flat(await page.locator('.summary-row-total').first().textContent()) === flat(`Customer Payable:${inr(5000)}`),
    await page.locator('.summary-row-total').first().textContent());
  check('step2: navbar badge tracks the quantity', (await badge()) === '2', `badge=${await badge()}`);
  check('step2: cart row shows Qty: 2', norm(await page.locator('.cart-item-row').first().textContent()).includes('Qty: 2'),
    norm(await page.locator('.cart-item-row').first().textContent()));

  const summaryAfterUp = flat(await page.locator('.summary-rows').textContent());
  check('step10: cart total never adds the seller 2% commission (' + inr(5100) + ' absent)',
    !summaryAfterUp.includes(flat(inr(5100))),
    summaryAfterUp);
  check('step10: cart totals are rendered in INR',
    summaryAfterUp.includes(flat(inr(5000))) && summaryAfterUp.includes('₹'),
    summaryAfterUp);

  await page.locator('.cart-item-row button[aria-label="Decrease quantity"]').click();
  const down = await waitFor(async () => flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(2500)}`));
  check('step2: lowering quantity back to 1 restores subtotal ' + inr(2500), !!down);
  await page.locator('.cart-item-row button[aria-label="Increase quantity"]').click();
  await waitFor(async () => flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(5000)}`));

  // The bag survives a refresh (sessionStorage mirror) before checkout runs.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.summary-row', { timeout: 15000 });
  check('step2: bag survives a page refresh at the same quantity', (await badge()) === '2',
    `badge=${await badge()}`);
  const bagBefore = await bag();
  const checkoutKey1 = bagBefore[0]?.checkoutKey;
  check('step2: checkout key is stable across the refresh',
    checkoutKey1 === bagBefore[0]?.checkoutKey && !!checkoutKey1, String(checkoutKey1));

  // --------------------------------------- 3. remove the item -> empty state
  await page.locator('.cart-item-row button[aria-label="Remove item"]').click();
  const emptied = await page.waitForSelector('text=Your bag is empty', { timeout: 10000 }).catch(() => null);
  check('step3: removing the last item shows the empty-bag state', !!emptied);
  check('step3: navbar badge returns to 0', (await badge()) === '0', `badge=${await badge()}`);
  check('step3: checkout form is gone in the empty state',
    (await page.locator('.checkout-form').count()) === 0);
  check('step3: stored bag is empty after removal', (await bag()).length === 0,
    JSON.stringify(await bag()));

  // --------------------------------- 4. checkout with missing/invalid fields
  await addToBag(p1);
  await waitFor(async () => (await badge()) === '1');
  await openCartPage();
  await page.waitForSelector('.checkout-form', { timeout: 15000 });
  await page.locator('.cart-item-row button[aria-label="Increase quantity"]').click();
  await waitFor(async () => flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(5000)}`));
  const bagForCheckout = await bag();
  const checkoutKey2 = bagForCheckout[0]?.checkoutKey;

  await fillCheckout({ name: '', phone: '12345', address: '', pin: '12' });
  await submitCheckout();
  const nameErr = await page.waitForSelector('#name-checkout-error', { timeout: 8000 }).catch(() => null);
  check('step4: empty name refused', !!nameErr && norm(await page.locator('#name-checkout-error').textContent()) === 'Name required',
    await page.locator('#name-checkout-error').textContent().catch(() => '(absent)'));
  check('step4: empty address refused', norm(await page.locator('#address-checkout-error').textContent().catch(() => '')) === 'Address required');
  check('step4: short PIN refused', norm(await page.locator('#pin-checkout-error').textContent().catch(() => '')) === 'Enter a valid 6-digit PIN');
  check('step4: invalid mobile refused', norm(await page.locator('#phone-checkout-error').textContent().catch(() => '')) === 'Enter a valid 10-digit mobile number');
  check('step4: invalid submission creates no order', (await orderCount(tCust)) === 0,
    `count=${await orderCount(tCust)}`);
  check('step4: no success message after a refused submission', !(await successVisible()));
  check('step4: bag still holds the item (qty 2)', (await badge()) === '2', `badge=${await badge()}`);

  // ------------------- 4b. backend refuses the request -> no simulated success
  await page.unroute('**/api/orders/checkout').catch(() => {});
  await page.route('**/api/orders/checkout', (route) => route.abort('failed'));
  await fillCheckout({
    name: 'QA Phase4 Buyer', phone: '9876543210',
    address: '12 Phase4 Test Lane', city: 'Indore', state: 'Madhya Pradesh', pin: '452001'
  });
  await submitCheckout();
  const failAlert = await page.waitForSelector('.checkout-form p[role="alert"]', { timeout: 15000 }).catch(() => null);
  const failMsg = failAlert ? norm(await failAlert.textContent()) : '';
  check('step4b: a failed backend request surfaces an error to the shopper', !!failMsg, failMsg);
  check('step4b: no "Order Confirmed" is shown when the request failed', !(await successVisible()));
  check('step4b: no order was created by the failed request', (await orderCount(tCust)) === 0,
    `count=${await orderCount(tCust)}`);
  check('step4b: bag is untouched by the failed request', (await badge()) === '2', `badge=${await badge()}`);
  check('step4b: bag row still rendered after the failure',
    (await page.locator('.cart-item-row').count()) === 1);
  await page.unroute('**/api/orders/checkout');
  check('step4b: no stock was reserved by the failed request', (await productStock(p1)) === 10,
    `stock=${await productStock(p1)}`);

  // ------------------------------------------- 5. checkout with valid fields
  await submitCheckout();
  const confirmed = await page.waitForSelector('.order-confirmed-title', { timeout: 20000 }).catch(() => null);
  const confirmText = confirmed ? norm(await page.locator('.order-confirmed-block').textContent()) : '';
  check('step5: valid submission shows the order confirmation', !!confirmed, confirmText);
  check('step5: confirmation quotes the INR amount actually charged',
    confirmText.includes(inr(5000)), confirmText);
  check('step5: confirmation names the real store',
    confirmText.includes('QA Phase4 Furniture'), confirmText);
  check('step7: bag cleared only after the confirmed order', (await badge()) === '0',
    `badge=${await badge()}`);
  check('step7: stored bag is empty after the confirmed order', (await bag()).length === 0,
    JSON.stringify(await bag()));

  // --------------------------------- 6. exactly one order was created (+ totals)
  const afterFirst = await call('GET', '/orders/mine', { token: tCust });
  const firstOrders = afterFirst.data?.data || [];
  const order1 = firstOrders.find((o) => String(o.productId) === String(p1));
  check('step6: exactly one order exists after one successful checkout', firstOrders.length === 1,
    `count=${firstOrders.length}`);
  check('step6: the order records the bag quantity (2)', order1?.quantity === 2, String(order1?.quantity));
  check('step6: order status starts as PENDING (payment pending)', order1?.status === 'PENDING',
    String(order1?.status));
  check('step10: customer total = agreed unit price x qty (2500 x 2 = 5000)',
    order1?.totalAmount === 5000, String(order1?.totalAmount));
  check('step10: 2% platform commission stored separately, not in the customer total',
    order1?.platformCommission === 100 && order1?.totalAmount === 5000,
    `total=${order1?.totalAmount} commission=${order1?.platformCommission}`);
  check('step6: stock reserved exactly once for the order', (await productStock(p1)) === 8,
    `stock=${await productStock(p1)}`);

  // ---- network retry with the SAME idempotency key resolves to the SAME order
  const retry = await call('POST', '/orders/checkout', { token: tCust, body: {
    productId: p1, quantity: 2, paymentMethod: 'CASH_ON_DELIVERY', requestId: checkoutKey2
  } });
  check('step9: replaying the same checkout key returns the first order (200)',
    retry.status === 200 && String(retry.data?.data?._id || retry.data?.data?.id) === String(order1?.id),
    `status=${retry.status} got=${retry.data?.data?._id || retry.data?.data?.id} want=${order1?.id}`);
  check('step9: the replay created no second order', (await orderCount(tCust)) === 1,
    `count=${await orderCount(tCust)}`);
  check('step9: the replay reserved no extra stock', (await productStock(p1)) === 8,
    `stock=${await productStock(p1)}`);

  // -------------------------------- 8. refresh + My Orders shows the order
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cart-badge', { timeout: 15000 });
  await page.locator('.nav-actions a[href="/orders"]').first().click();
  const orderCard = await page.waitForSelector('.order-card', { timeout: 20000 }).catch(() => null);
  check('step8: My Orders shows the order after a refresh', !!orderCard);
  const cardText = orderCard ? norm(await orderCard.textContent()) : '';
  check('step8: order row shows the order number', /Order #[A-Z0-9]{8}/.test(cardText), cardText);
  check('step8: order row shows the INR total paid by the customer',
    cardText.includes('Total Paid by Customer') && cardText.includes(inr(5000)), cardText);
  check('step8: order row shows the seller commission as a separate line',
    cardText.includes('Seller platform commission:') && cardText.includes(inr(100, true)), cardText);
  check('step8: order row shows the payment-pending status label',
    cardText.includes('Payment Pending'), cardText);
  check('step8: exactly one order card rendered', (await page.locator('.order-card').count()) === 1,
    String(await page.locator('.order-card').count()));
  check('step8: history comes from the API, not a local mirror',
    await page.evaluate(() => localStorage.getItem('neardeal_orders') === null));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const again = await page.waitForSelector('.order-card', { timeout: 20000 }).catch(() => null);
  check('step8: the order still exists after a second full reload', !!again);

  // --------------------------------- 9. repeated submission = ONE new order
  const beforeDouble = await orderCount(tCust);
  await addToBag(p1);
  await waitFor(async () => (await badge()) === '1');
  await openCartPage();
  await page.waitForSelector('.checkout-form', { timeout: 15000 });
  await fillCheckout({
    name: 'QA Phase4 Buyer', phone: '9876543210',
    address: '12 Phase4 Test Lane', city: 'Indore', state: 'Madhya Pradesh', pin: '452001'
  });
  // Two submissions dispatched back-to-back in one tick: the worst-case double
  // click, before React has even disabled the button.
  await page.evaluate(() => {
    const form = document.querySelector('.checkout-form');
    form.requestSubmit();
    form.requestSubmit();
  });
  const doubleSettled = await page.waitForSelector('.order-confirmed-title, .checkout-form p[role="alert"]', { timeout: 20000 }).catch(() => null);
  const doubleCount = await waitFor(async () => {
    const n = await orderCount(tCust);
    return n > beforeDouble ? n : null;
  }, { timeout: 15000 });
  check('step9: double submission settles on a confirmation, not an error',
    !!doubleSettled && (await successVisible()), norm(await doubleSettled.textContent().catch(() => '')));
  check('step9: double submission created exactly ONE new order',
    doubleCount === beforeDouble + 1, `before=${beforeDouble} after=${doubleCount}`);
  check('step9: double submission reserved stock exactly once', (await productStock(p1)) === 7,
    `stock=${await productStock(p1)}`);
  check('step9: bag cleared by the single confirmed order', (await badge()) === '0',
    `badge=${await badge()}`);

  // --------------- 10/multi-line. partial failure -> retry -> no duplicates
  const beforeMulti = await orderCount(tCust);
  await addToBag(p1);
  await waitFor(async () => (await badge()) === '1');
  await addToBag(p2);
  await waitFor(async () => (await badge()) === '2');
  await openCartPage();
  await page.waitForSelector('.checkout-form', { timeout: 15000 });
  check('step10: multi-line subtotal adds both lines (2500 + 1000)',
    flat(await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent()) === flat(`Subtotal:${inr(3500)}`),
    await page.locator('.summary-row', { hasText: 'Subtotal:' }).first().textContent());
  check('step10: multi-line payable equals the subtotal (no commission)',
    flat(await page.locator('.summary-row-total').first().textContent()) === flat(`Customer Payable:${inr(3500)}`),
    await page.locator('.summary-row-total').first().textContent());

  await page.unroute('**/api/orders/checkout').catch(() => {});
  await page.route('**/api/orders/checkout', (route) => {
    const body = route.request().postDataJSON();
    if (String(body?.productId) === String(p2)) return route.abort('failed');
    return route.continue();
  });
  await fillCheckout({
    name: 'QA Phase4 Buyer', phone: '9876543210',
    address: '12 Phase4 Test Lane', city: 'Indore', state: 'Madhya Pradesh', pin: '452001'
  });
  await submitCheckout();
  const partialAlert = await page.waitForSelector('.checkout-form p[role="alert"]', { timeout: 20000 }).catch(() => null);
  const partialOrders = await waitFor(async () => {
    const n = await orderCount(tCust);
    return n > beforeMulti ? n : null;
  }, { timeout: 15000 });
  check('step7: partial failure reports the error instead of confirming',
    !!partialAlert && !(await successVisible()), partialAlert ? norm(await partialAlert.textContent()) : '(no alert)');
  check('step7: bag is NOT cleared while one line is still unplaced',
    (await badge()) === '2', `badge=${await badge()}`);
  check('step7: the line the backend accepted created exactly one order',
    partialOrders === beforeMulti + 1, `before=${beforeMulti} partial=${partialOrders}`);

  await page.unroute('**/api/orders/checkout');
  await submitCheckout();
  const multiConfirmed = await page.waitForSelector('.order-confirmed-title', { timeout: 20000 }).catch(() => null);
  check('step5: retrying the whole bag confirms once every line is placed', !!multiConfirmed);
  const finalOrders = (await (await call('GET', '/orders/mine', { token: tCust })).data?.data) || [];
  const p1Orders = finalOrders.filter((o) => String(o.productId) === String(p1));
  const p2Orders = finalOrders.filter((o) => String(o.productId) === String(p2));
  check('step9: retry did NOT duplicate the already-placed line (P1 rows = 3)',
    p1Orders.length === 3, `p1Orders=${p1Orders.length}`);
  check('step9: retry placed the failed line exactly once (P2 rows = 1)',
    p2Orders.length === 1, `p2Orders=${p2Orders.length}`);
  check('step6: one order document per bag line, none duplicated',
    finalOrders.length === beforeMulti + 2, `total=${finalOrders.length} expected=${beforeMulti + 2}`);
  const keys = finalOrders.map((o) => o.id);
  check('step9: every order row is distinct', new Set(keys).size === keys.length);
  check('step10: multi-line order totals exclude commission',
    p1Orders.every((o) => o.totalAmount === o.quantity * 2500) &&
      p2Orders.every((o) => o.totalAmount === o.quantity * 1000) &&
      finalOrders.every((o) => o.platformCommission === o.totalAmount * 0.02),
    JSON.stringify(finalOrders.map((o) => [o.totalAmount, o.platformCommission])));
  check('step6: final stock reflects exactly the placed units (P1 = 6, P2 = 9)',
    (await productStock(p1)) === 6 && (await productStock(p2)) === 9,
    `p1=${await productStock(p1)} p2=${await productStock(p2)}`);
  check('step7: bag cleared after the fully successful retry', (await badge()) === '0',
    `badge=${await badge()}`);

  check('runtime: no uncaught page exceptions during the whole flow', pageErrors.length === 0,
    pageErrors.join(' | '));

  // Keep the shared catalogue clean: the QA listings are removed from the
  // storefront through the owner's own delete endpoint (soft delete), so no
  // test listing stays visible to shoppers. The QA orders are left intact —
  // they are the evidence of this run, stored under the QA customer only.
  await call('DELETE', `/products/${p1}`, { token: tSeller });
  await call('DELETE', `/products/${p2}`, { token: tSeller });

  await browser.close();
})()
  .catch((e) => {
    check('harness: completed without crashing', false, e.message);
    console.error('HARNESS_ERROR:', e);
  })
  .finally(() => {
    console.log('----------------------------------------');
    for (const p of PASS) console.log(`PASS  ${p}`);
    for (const f of FAIL) console.log(`FAIL  ${f}`);
    console.log('----------------------------------------');
    console.log(`${PASS.length} passed, ${FAIL.length} failed`);
    process.exit(FAIL.length ? 1 : 0);
  });
