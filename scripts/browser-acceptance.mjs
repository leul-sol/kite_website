// Run only against the disposable backend created by acceptance_backend.py.
// Credentials arrive on stdin, never in command arguments or an artifact.
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const config = JSON.parse(input);
const origin = new URL(config.origin), adminOrigin = new URL(config.adminOrigin);
if (![origin, adminOrigin].every(url => ['127.0.0.1', 'localhost'].includes(url.hostname)) || !config.email.endsWith("@example.invalid")) {
  throw new Error("Browser acceptance requires the isolated loopback acceptance account");
}
const artifacts = fileURLToPath(new URL("../../kite_backend/.mvn/browser-acceptance/", import.meta.url));
await mkdir(artifacts, { recursive: true });
const results = [], errors = [];
let browser, page, currentCheck;
const failedResponses = [];
const observe = target => {
  target.on("pageerror", error => errors.push(error.message));
  target.on("response", response => {
    if (response.status() >= 400) failedResponses.push({ path: new URL(response.url()).pathname, status: response.status() });
  });
};
const check = async (name, work) => { currentCheck = name; await work(); results.push({ name, passed: true }); console.log(`PASS ${name}`); };
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  observe(page);
  page.setDefaultTimeout(10000);
  await check("real browser login retains HTTP-only cookies and loads provider data", async () => {
    await page.goto(`${config.origin}/listings`);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await page.getByLabel("Email address", { exact: true }).fill(config.email);
    await page.getByLabel("Password", { exact: true }).fill(config.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Held rental earnings", { exact: true })).toBeVisible();
    await expect(page.getByText("ETB 240.00", { exact: true })).toBeVisible();
    const cookies = await context.cookies();
    for (const name of ["kite_access", "kite_refresh"]) {
      const cookie = cookies.find(value => value.name === name);
      expect(cookie?.httpOnly).toBe(true); expect(cookie?.secure).toBe(true); expect(cookie?.sameSite).toBe("Strict");
    }
    expect(await page.evaluate(() => document.cookie)).not.toContain("kite_access");
  });
  await page.getByRole("link", { name: "Listings", exact: true }).click();
  await expect(page.getByRole("button", { name: "Manage photos", exact: true })).toBeVisible();
  const originalBytes = await (await context.request.get(config.origin + config.photoUrl.replace("/api/v1/", "/api/backend/"))).body();
  let dialog;
  await check("creating a listing opens an empty photo manager without creating duplicate listings", async () => {
    await page.getByRole("button", { name: "Add Listing", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Create listing", exact: true });
    await dialog.getByLabel("Listing name", { exact: true }).fill(`Browser acceptance ${Date.now()}`);
    await dialog.getByLabel("Description", { exact: true }).fill("Synthetic browser listing");
    await dialog.getByLabel("Daily rate (ETB)", { exact: true }).fill("100.01");
    await dialog.getByLabel("Stock quantity", { exact: true }).fill("3");
    await dialog.getByRole("button", { name: "Create listing", exact: true }).click();
    await expect(dialog.getByText("No uploaded photos yet.", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Create listing", exact: true })).toHaveCount(0);
  });
  const file = { name: "synthetic.png", mimeType: "image/png", buffer: originalBytes };
  const inputFile = () => dialog.getByLabel("Add photo", { exact: true });
  const images = () => dialog.getByRole("img");
  await check("actual PNG uploads display decoded thumbnails and disable concurrent mutation", async () => {
    let release, started;
    const gate = new Promise(resolve => { release = resolve; });
    const arrival = new Promise(resolve => { started = resolve; });
    const delay = async route => { if (route.request().method() === "POST") { started(); await gate; } await route.continue(); };
    await page.route("**/api/backend/catalog/items/*/images", delay);
    await inputFile().setInputFiles(file);
    await arrival;
    try {
      await expect(inputFile()).toBeDisabled();
      await expect(dialog.getByRole("button", { name: "Done", exact: true })).toBeDisabled();
      await page.keyboard.press("Escape"); await expect(dialog).toBeVisible();
    }
    finally { release(); }
    await expect(images()).toHaveCount(1);
    await expect(images()).toHaveJSProperty("naturalWidth", 1);
    await page.unroute("**/api/backend/catalog/items/*/images", delay);
    await expect(inputFile()).toBeEnabled();
    await inputFile().setInputFiles(file);
    await expect(images()).toHaveCount(2);
    await page.screenshot({ path: `${artifacts}/desktop-listing-photos.png` });
  });
  await check("cover ordering and deletion are confirmed and survive page reload", async () => {
    const articles = dialog.locator("article");
    await expect(articles).toHaveCount(2);
    const secondUrl = await articles.nth(1).getByRole("img").getAttribute("src");
    await articles.nth(1).getByRole("button", { name: "Make cover", exact: true }).click();
    await expect(articles.nth(0).getByRole("img")).toHaveAttribute("src", secondUrl);
    await dialog.getByRole("button", { name: "Delete photo 2", exact: true }).click();
    await expect(dialog.getByRole("group", { name: "Confirm photo removal" })).toBeVisible();
    await dialog.getByRole("button", { name: "Keep photo", exact: true }).click();
    await expect(images()).toHaveCount(2);
    await dialog.getByRole("button", { name: "Delete photo 2", exact: true }).click();
    await dialog.getByRole("button", { name: "Remove photo", exact: true }).click();
    await expect(images()).toHaveCount(1);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await page.reload();
    const row = page.getByRole("row").filter({ hasText: "Browser acceptance" });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("img")).toHaveAttribute("src", secondUrl);
    await row.getByRole("button", { name: "Manage photos", exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(images()).toHaveCount(1);
  });
  await check("invalid files and failed uploads preserve existing photos and allow recovery", async () => {
    await inputFile().setInputFiles({ name: "not-a-photo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") });
    await expect(dialog.getByRole("alert")).toContainText("Choose a PNG or JPEG");
    await expect(images()).toHaveCount(1);
    const fail = route => route.request().method() === "POST" ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Synthetic upload unavailable" }) }) : route.continue();
    await page.route("**/api/backend/catalog/items/*/images", fail);
    await inputFile().setInputFiles(file);
    await expect(dialog.getByRole("alert")).toContainText("Synthetic upload unavailable");
    await expect(inputFile()).toBeEnabled(); await expect(images()).toHaveCount(1);
    await page.unroute("**/api/backend/catalog/items/*/images", fail);
    await inputFile().setInputFiles(file);
    await expect(images()).toHaveCount(2);
  });
  await check("five-photo limit prevents another upload", async () => {
    for (let count = 3; count <= 5; count++) {
      await expect(inputFile()).toBeEnabled(); await inputFile().setInputFiles(file);
      await expect(images()).toHaveCount(count);
    }
    await expect(inputFile()).toBeDisabled();
  });
  await check("photo dialogs keep keyboard focus inside and restore it after Escape", async () => {
    await dialog.getByRole("button", { name: "Done", exact: true }).focus();
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Done", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("row").filter({ hasText: "Browser acceptance" }).getByRole("button", { name: "Manage photos", exact: true })).toBeFocused();
  });
  const newRow = () => page.getByRole("row").filter({ hasText: "Browser acceptance" });
  let listingId;
  await check("listing editor saves price, deposit and stock while preserving uploaded photos", async () => {
    const src = await newRow().getByRole("img").getAttribute("src");
    listingId = src.split("/items/")[1].split("/")[0];
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await expect(editor.getByLabel("Listing name", { exact: true })).toBeVisible();
    await editor.getByLabel("Description", { exact: true }).fill("Updated in Chromium");
    await editor.getByLabel("Daily rate (ETB)", { exact: true }).fill("150.25");
    await editor.getByLabel("Security deposit (ETB)", { exact: true }).fill("50.10");
    await editor.getByLabel("Stock quantity", { exact: true }).fill("4");
    await editor.getByRole("button", { name: "Save listing", exact: true }).click();
    await expect(editor).toHaveCount(0); await expect(newRow()).toContainText("150.25");
    await expect(newRow()).toContainText("4 units");
    await page.reload(); await expect(newRow().getByRole("img")).toHaveAttribute("src", src);
    const details = await (await context.request.get(`${config.origin}/api/backend/catalog/items/${listingId}`)).json();
    expect(details.securityDepositMinor).toBe(5010); expect(details.description).toBe("Updated in Chromium");
  });
  await check("availability changes require confirmation and hide/show uploaded images", async () => {
    const src = await newRow().getByRole("img").getAttribute("src");
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await editor.getByLabel("Active listing", { exact: true }).uncheck();
    await editor.getByRole("button", { name: "Save listing", exact: true }).click();
    await expect(editor.getByRole("group", { name: "Confirm listing availability change" })).toBeVisible();
    await expect(newRow().getByRole("cell", { name: "Active", exact: true })).toHaveCount(1);
    await editor.getByRole("button", { name: "Confirm changes", exact: true }).click();
    await expect(editor).toHaveCount(0); await expect(newRow()).toContainText("Inactive");
    expect((await context.request.get(config.origin + src)).status()).toBe(404);
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    await editor.getByLabel("Active listing", { exact: true }).check();
    await editor.getByRole("button", { name: "Save listing", exact: true }).click();
    await editor.getByRole("button", { name: "Confirm changes", exact: true }).click();
    await expect(editor).toHaveCount(0); await expect(newRow().getByRole("img")).toHaveAttribute("src", src);
  });
  await check("a stale browser editor cannot overwrite another tab's listing changes", async () => {
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await expect(editor.getByLabel("Listing name", { exact: true })).toBeVisible();
    const current = await (await context.request.get(`${config.origin}/api/backend/catalog/items/${listingId}`)).json();
    const changed = await context.request.patch(`${config.origin}/api/backend/catalog/items/${listingId}`, {
      headers: { Origin: config.origin }, data: { expectedRevision: current.revision, name: current.name, description: "Saved in another tab",
        categoryId: current.categoryId, pricePerDayMinor: current.pricePerDayMinor, securityDepositMinor: current.securityDepositMinor,
        quantityAvailable: current.quantityAvailable, active: current.active },
    });
    expect(changed.ok()).toBe(true);
    await editor.getByLabel("Description", { exact: true }).fill("Stale unsaved change");
    await editor.getByRole("button", { name: "Save listing", exact: true }).click();
    await expect(editor.getByText("Reload to use the latest listing before saving again. Reloading replaces the unsaved form.")).toBeVisible();
    await expect(editor.getByRole("button", { name: "Save listing", exact: true })).toBeDisabled();
    await editor.getByRole("button", { name: "Reload listing", exact: true }).click();
    await expect(editor.getByLabel("Description", { exact: true })).toHaveValue("Saved in another tab");
    await editor.getByRole("button", { name: "Close editor", exact: true }).click();
  });
  await check("unreserved stock reduction requires confirmation and can safely reach zero", async () => {
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await editor.getByLabel("Stock quantity", { exact: true }).fill("0");
    await editor.getByRole("button", { name: "Save listing", exact: true }).click();
    await expect(editor.getByRole("heading", { name: "Reduce stock to 0?", exact: true })).toBeVisible();
    await expect(newRow()).toContainText("4 units");
    await editor.getByRole("button", { name: "Confirm changes", exact: true }).click();
    await expect(editor).toHaveCount(0); await expect(newRow()).toContainText("0 units");
    await page.reload(); await expect(newRow()).toContainText("0 units");
  });
  await check("listing removal requires confirmation and removes the inventory entry", async () => {
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await editor.getByRole("button", { name: "Remove listing", exact: true }).click();
    await expect(editor.getByRole("group", { name: "Confirm listing removal" })).toBeVisible();
    await editor.getByRole("button", { name: "Keep listing", exact: true }).click();
    await expect(newRow()).toBeVisible();
    await editor.getByRole("button", { name: "Close editor", exact: true }).click();
  });
  await check("phone-sized inventory and photo dialog fit the viewport", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("row").filter({ hasText: "Browser acceptance" }).getByRole("button", { name: "Manage photos", exact: true }).click();
    dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Cover photo", { exact: false })).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(391);
    await page.screenshot({ path: `${artifacts}/phone-listing-photos.png` });
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check("setup showcase creation and uploaded cover persist in the browser", async () => {
    await page.goto(`${config.origin}/setups`);
    await page.getByLabel("Name", { exact: true }).fill("Browser showcase");
    await page.getByLabel("Description", { exact: true }).fill("Synthetic arrangement");
    await page.getByLabel("Reference daily rate (ETB)", { exact: true }).fill("200.00");
    await page.getByRole("button", { name: "Create setup", exact: true }).click();
    const photos = page.getByRole("dialog", { name: "Setup photos", exact: true });
    await photos.getByLabel("Add photo", { exact: true }).setInputFiles(file);
    await expect(photos.getByRole("img")).toHaveCount(1);
    await photos.getByRole("button", { name: "Done", exact: true }).click();
    await page.reload(); await expect(page.getByRole("img", { name: "Browser showcase", exact: true })).toBeVisible();
  });
  await check("analytics loads a bounded period and exports a CSV", async () => {
    await page.goto(`${config.origin}/analytics`);
    await page.getByLabel("Reporting period").selectOption("7");
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(8);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export analytics CSV" }).click();
    expect((await download).suggestedFilename()).toBe("kite-provider-analytics.csv");
  });
  const adminContext = await browser.newContext(), adminPage = await adminContext.newPage();
  observe(adminPage);
  const login = async (target, account) => {
    await target.goto(`${config.origin}/auth/login`);
    await target.getByLabel("Email address", { exact: true }).fill(account.email);
    await target.getByLabel("Password", { exact: true }).fill(account.password);
    await target.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(target).toHaveURL(/\/dashboard$/);
  };
  // Administrators work in the separate kite_admin console, never in the provider portal.
  await check("administrators are refused by the provider portal and sign in to kite_admin", async () => {
    await adminPage.goto(`${config.origin}/auth/login`);
    await adminPage.getByLabel("Email address", { exact: true }).fill(config.admin.email);
    await adminPage.getByLabel("Password", { exact: true }).fill(config.admin.password);
    await adminPage.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(adminPage.getByText("A provider account is required for this portal", { exact: true })).toBeVisible();
    await adminPage.goto(`${config.adminOrigin}/auth/login`);
    await adminPage.getByLabel("Email address", { exact: true }).fill(config.admin.email);
    await adminPage.getByLabel("Password", { exact: true }).fill(config.admin.password);
    await adminPage.getByRole("button", { name: "Sign in to workspace" }).click();
    await expect.poll(() => adminPage.url()).toBe(`${config.adminOrigin}/`);
  });
  await check("order confirmation and rental start persist through real browser actions", async () => {
    await page.goto(`${config.origin}/orders`);
    const order = page.getByRole("article").filter({ hasText: config.bookingId });
    for (const name of ["Confirm booking", "Start rental"]) {
      await order.getByRole("button", { name, exact: true }).click();
      await page.getByRole("button", { name: "Confirm action", exact: true }).click();
    }
    await expect(order).toContainText("Status: active");
    await page.reload(); await expect(order).toContainText("Status: active");
  });
  await check("provider opens a dispute and admin records a resolution", async () => {
    await page.goto(`${config.origin}/disputes`);
    await page.getByLabel("Booking", { exact: true }).selectOption(config.bookingId);
    await page.getByLabel("Reason", { exact: true }).fill("Synthetic browser dispute");
    await page.getByRole("button", { name: "Open dispute", exact: true }).click();
    await expect(page.getByRole("heading", { name: "OPEN", exact: true })).toBeVisible();
    await page.goto(`${config.origin}/orders`);
    const order = page.getByRole("article").filter({ hasText: config.bookingId });
    await order.getByRole("button", { name: "Complete rental", exact: true }).click();
    await page.getByRole("button", { name: "Confirm action", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(order).toContainText("Status: active");
    await adminPage.goto(`${config.adminOrigin}/admin/disputes`);
    const dispute = adminPage.getByRole("article").filter({ hasText: config.bookingId });
    await dispute.getByLabel("Resolution", { exact: true }).fill("Synthetic resolution agreed by both parties");
    await dispute.getByRole("button", { name: "Resolve dispute", exact: true }).click();
    await expect(dispute).toHaveCount(0);
    await page.goto(`${config.origin}/disputes`); await page.getByLabel("Booking", { exact: true }).selectOption(config.bookingId);
    await expect(page.getByRole("heading", { name: "RESOLVED", exact: true })).toBeVisible();
  });
  await check("policy settings deny provider escalation and settlement requires independent review", async () => {
    await page.goto(`${config.origin}/policies`);
    await expect(page.getByText("The platform currently uses mandatory defaults. Provider customization is disabled.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save platform policy", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve settlement", exact: true })).toHaveCount(0);
    await page.goto(`${config.origin}/orders`);
    const order=page.getByRole("article").filter({ hasText: config.bookingId });
    await order.getByRole("button", { name: "Complete rental", exact: true }).click();
    await page.getByRole("button", { name: "Confirm action", exact: true }).click();
    await expect(order).toContainText("Status: completed");
    await adminPage.goto(`${config.adminOrigin}/policies`);
    await expect(adminPage.getByRole("button", { name: "Save platform policy", exact: true })).toHaveCount(0);
    const review=adminPage.getByRole("article").filter({ hasText: config.bookingId });
    await review.getByLabel("Review reason", { exact: true }).fill("Independent browser rental review completed");
    await review.getByRole("checkbox").check();
    await review.getByRole("button", { name: "Approve settlement", exact: true }).click();
    await expect(review.getByText("Settlement approved.", { exact: true })).toBeVisible();
  });
  await check("central audit viewer filters changes, protects private data and reports partial outages", async () => {
    await adminPage.goto(`${config.adminOrigin}/admin/audit`);
    await expect.poll(()=>adminPage.locator("tbody tr").count()).toBeGreaterThan(0);
    await expect(adminPage.getByText("Results are incomplete.", {exact:true})).toHaveCount(0);
    await adminPage.getByLabel("Service", {exact:true}).selectOption("catalog");
    await adminPage.getByLabel("Related user, booking or item ID", {exact:true}).fill(config.auditItemId);
    await adminPage.getByLabel("Action", {exact:true}).fill("ITEMS.UPDATE");
    await adminPage.getByRole("button",{name:"Search audit",exact:true}).click();
    await expect(adminPage.locator("tbody tr").first()).toContainText("ITEMS.UPDATE");
    await adminPage.getByRole("button",{name:/^View audit event/}).first().click();
    const detail=adminPage.getByRole("dialog",{name:"Audit event details",exact:true});
    await expect(detail).toContainText("price_per_day_minor");
    expect(await detail.textContent()).not.toContain("encrypted_data");
    await detail.getByRole("button",{name:"Close details",exact:true}).click();
    await adminPage.getByLabel("Service",{exact:true}).selectOption("all");
    await adminPage.getByLabel("Related user, booking or item ID",{exact:true}).fill("");
    await adminPage.getByLabel("Action",{exact:true}).fill("");
    const unavailable=route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Synthetic audit source unavailable"})});
    await adminPage.route("**/api/backend/payments/admin/audit**",unavailable);
    await adminPage.getByRole("button",{name:"Search audit",exact:true}).click();
    await expect(adminPage.getByText("Results are incomplete.",{exact:true})).toBeVisible();
    await expect.poll(()=>adminPage.locator("tbody tr").count()).toBeGreaterThan(0);
    await adminPage.unroute("**/api/backend/payments/admin/audit**",unavailable);
    await adminPage.getByRole("button",{name:"Refresh audit",exact:true}).click();
    await expect(adminPage.getByText("Loading audit records...",{exact:true})).toHaveCount(0);
    await expect(adminPage.getByText("Results are incomplete.",{exact:true})).toHaveCount(0);
    for (const screen of ["/admin/audit", "/admin/kyc", "/admin/disputes"]) {
      expect((await page.goto(`${config.origin}${screen}`)).status()).toBe(404);
    }
  });
  const providerContext = await browser.newContext(), providerPage = await providerContext.newPage();
  observe(providerPage);
  await login(providerPage, config.newProvider);
  await check("provider submits private PDF and image evidence for browser KYC review", async () => {
    await providerPage.goto(`${config.origin}/verification`);
    await providerPage.getByLabel("Business name", { exact: true }).fill("Browser KYC Rentals");
    await providerPage.getByLabel("Location", { exact: true }).fill("Addis Ababa");
    await providerPage.getByLabel("About your business", { exact: true }).fill("Synthetic browser verification");
    await providerPage.getByRole("button", { name: "Save business profile" }).click();
    await expect(providerPage.getByText("Business profile saved.", { exact: true })).toBeVisible();
    for (const [type, evidence] of [["IDENTITY", { name: "synthetic.pdf", mimeType: "application/pdf", buffer: Buffer.from(config.pdf, "base64") }], ["BUSINESS_REGISTRATION", file]]) {
      await providerPage.getByLabel("Document type", { exact: true }).selectOption(type);
      await providerPage.getByLabel("Evidence document", { exact: true }).setInputFiles(evidence);
      await providerPage.getByRole("button", { name: "Upload document", exact: true }).click();
      await expect(providerPage.getByText("Document uploaded. Select the evidence to submit.", { exact: true })).toBeVisible();
    }
    await providerPage.getByRole("button", { name: "Submit selected documents", exact: true }).click();
    await expect(providerPage.getByText("Your submission is awaiting review.", { exact: true })).toBeVisible();
    await adminPage.goto(`${config.adminOrigin}/admin/kyc`);
    await adminPage.getByRole("listitem").filter({ hasText: "Browser KYC Rentals" }).getByRole("button", { name: /Review submission/ }).click();
    await expect(adminPage.getByRole("button", { name: "View image", exact: true }).and(adminPage.locator(":enabled"))).toHaveCount(1);
    const pdfRow = adminPage.getByRole("listitem").filter({ has: adminPage.getByRole("button", { name: "View image", exact: true }).and(adminPage.locator(":disabled")) });
    const download = adminPage.waitForEvent("download");
    await pdfRow.getByRole("button", { name: "Download evidence", exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
    await adminPage.getByLabel("Decision", { exact: true }).selectOption("APPROVED");
    await adminPage.getByLabel("Reason", { exact: true }).fill("Synthetic browser evidence reviewed");
    await adminPage.getByRole("button", { name: "Approve submission", exact: true }).click();
    await expect(adminPage.getByText("Submission approved. The decision was recorded.", { exact: true })).toBeVisible();
    await providerPage.reload(); await expect(providerPage.getByText("verified", { exact: true })).toBeVisible();
  });
  await check("browser account recovery changes password and rejects token reuse", async () => {
    await providerPage.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(providerPage).toHaveURL(/\/auth\/login$/);
    await providerPage.goto(`${config.origin}/auth/forgot-password`);
    await providerPage.getByLabel("Email address", { exact: true }).fill(config.newProvider.email);
    const [response] = await Promise.all([
      providerPage.waitForResponse(value => value.url().endsWith("/api/backend/auth/password/forgot") && value.request().method() === "POST"),
      providerPage.getByRole("button", { name: "Request reset instructions", exact: true }).click(),
    ]);
    const data = await response.json(); expect(data.devResetToken).toBeTruthy();
    await providerPage.goto(`${config.origin}/auth/reset-password?token=${encodeURIComponent(data.devResetToken)}`);
    const password = "Synthetic-Browser-Reset-9aA!";
    await providerPage.getByLabel("Password", { exact: true }).fill(password);
    await providerPage.getByRole("button", { name: "Save new password", exact: true }).click();
    await expect(providerPage.getByText("Password changed. You can now sign in.", { exact: true })).toBeVisible();
    await providerPage.getByRole("button", { name: "Save new password", exact: true }).click();
    await expect(providerPage.getByRole("alert")).toBeVisible();
    await login(providerPage, { email: config.newProvider.email, password });
  });
  await adminContext.close(); await providerContext.close();
  await check("confirmed listing removal hides its photos and preserves the original inventory", async () => {
    await page.goto(`${config.origin}/listings`);
    const src = await newRow().getByRole("img").getAttribute("src");
    await newRow().getByRole("button", { name: "Edit listing", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit listing", exact: true });
    await editor.getByRole("button", { name: "Remove listing", exact: true }).click();
    await editor.getByRole("button", { name: "Confirm removal", exact: true }).click();
    await expect(newRow()).toHaveCount(0);
    expect((await context.request.get(config.origin + src)).status()).toBe(404);
  });
  await check("browser logout removes session access", async () => {
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    await page.goto(`${config.origin}/listings`); await expect(page).toHaveURL(/\/auth\/login$/);
    expect(errors).toEqual([]);
  });
  await writeFile(`${artifacts}/report.json`, JSON.stringify({ passed: true, checks: results, nativeDevice: "not tested" }, null, 2));
} catch (error) {
  if (page) await page.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
  for (const [index, context] of (browser?.contexts() ?? []).entries()) {
    for (const [tab, target] of context.pages().entries()) await target.screenshot({ path: `${artifacts}/failure-context-${index}-${tab}.png` }).catch(() => {});
  }
  await writeFile(`${artifacts}/report.json`, JSON.stringify({ passed: false, checks: results, failedCheck: currentCheck, error: error.message, pageErrors: errors, failedResponses, nativeDevice: "not tested" }, null, 2));
  console.error(`${currentCheck}: ${error.message}`); process.exitCode = 1;
} finally { await browser?.close(); }
