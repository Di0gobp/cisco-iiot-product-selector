import { test, expect } from '@playwright/test';
import { assertion, fixtureCatalog, product, source } from '../fixtures';
import { readFile } from 'node:fs/promises';

test('research preview search, category filters, and source disclosure', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Build your shortlist' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Source-reviewed starter catalog · deployment checks remain open',
    ),
  ).toBeVisible();
  await expect(page.locator('.product-card:not(.research-card)')).toHaveCount(
    24,
  );
  await page.getByRole('searchbox').fill('IR1001-G2');
  await expect(page.locator('.product-card:not(.research-card)')).toHaveCount(
    1,
  );
  await page.getByRole('link', { name: 'IR1001-G2', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'IR1001-G2', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Built-in port inventory' }),
  ).toBeVisible();
  const link = page.getByRole('link', { name: 'View official source' }).first();
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', /https:\/\/www\.cisco\.com\//);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'IR1001-G2', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('expansion selection recalculates, persists and exports exact component PIDs', async ({
  page,
}) => {
  await page.goto('/#/product/IE-3300-8T2S-E');
  const panel = page.locator('.expansion-panel');
  await panel.getByLabel('Configuration management mode').selectOption('local');
  await panel.getByLabel('Configuration firmware').fill('17.18.3');
  await panel
    .getByLabel('Confirmed base/runtime licenses')
    .selectOption(['network-essentials']);
  await panel.getByLabel('Required physical ports', { exact: true }).fill('18');
  await panel.getByLabel('Ports required at this speed').fill('18');
  await panel
    .getByRole('button', { name: 'Add IEM-3300-8T=', exact: true })
    .click();
  const copper = panel
    .locator('.configuration-totals')
    .getByRole('row', { name: /^Dedicated copper/ });
  await expect(copper.locator('td')).toHaveText(['8', '8', '16', '16']);
  await expect(
    panel
      .locator('.configuration-totals')
      .getByRole('row', { name: /^Physical Ethernet/ })
      .locator('td'),
  ).toHaveText(['10', '8', '18', '18']);
  await page.reload();
  await expect(page.locator('.selected-modules')).toContainText('IEM-3300-8T=');
  await expect(copper.locator('td')).toHaveText(['8', '8', '16', '16']);
  const bomPromise = page.waitForEvent('download');
  await panel
    .getByRole('button', { name: 'Export BOM CSV', exact: true })
    .click();
  const bom = await bomPromise;
  const csv = await readFile((await bom.path())!, 'utf8');
  expect(csv).toContain('"IE-3300-8T2S-E","1"');
  expect(csv).toContain('"IEM-3300-8T=","1"');
  const jsonPromise = page.waitForEvent('download');
  await panel
    .getByRole('button', { name: 'Download configuration JSON' })
    .click();
  const file = await jsonPromise;
  const saved = JSON.parse(await readFile((await file.path())!, 'utf8'));
  expect(saved.configurations[0].basePid).toBe('IE-3300-8T2S-E');
  expect(saved.configurations[0].modulePids).toEqual(['IEM-3300-8T=']);
  await page
    .getByRole('button', { name: 'Add to comparison', exact: true })
    .click();
  await page.goto('/#/product/IE-3300-8T2S-A');
  await page
    .getByRole('button', { name: 'Add to comparison', exact: true })
    .click();
  await page.goto('/#/compare');
  await expect(
    page.getByRole('columnheader', { name: /IE-3300-8T2S-E/ }),
  ).toContainText('IEM-3300-8T=');
  await expect(
    page.getByRole('row', { name: /^Hardware configuration/ }),
  ).toContainText('18 proposed physical ports');
  const comparisonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV with sources' }).click();
  const comparison = await comparisonPromise;
  expect(await readFile((await comparison.path())!, 'utf8')).toContain(
    'IEM-3300-8T=',
  );
  await page.goto('/#/product/IE-3300-8T2S-E');
  await panel
    .getByRole('button', { name: 'Remove IEM-3300-8T=', exact: true })
    .click();
  await expect(copper.locator('td')).toHaveText(['8', '0', '8', '8']);
  await expect(
    panel
      .locator('.configuration-totals')
      .getByRole('row', { name: /^Physical Ethernet/ })
      .locator('td'),
  ).toHaveText(['10', '0', '10', '10']);
  await expect(panel).toContainText('0/1 documented positions used');
  await expect(panel).toContainText('Equipment consumption: 23 W');
});

test('incompatible PoE modules cannot be added and undocumented chassis expansion stays explicit', async ({
  page,
}) => {
  await page.goto('/#/product/IE-3300-8T2S-E');
  await expect(
    page.getByRole('button', { name: 'Add IEM-3300-8P=', exact: true }),
  ).toBeDisabled();
  await page.goto('/#/product/IE-9320-24T4X-E');
  await expect(page.locator('.expansion-panel')).toContainText(
    'No official port-expansion module has been verified',
  );
  await expect(
    page.locator('.expansion-panel').getByRole('button', { name: /Add IEM/ }),
  ).toHaveCount(0);
});

test('Meraki expansion remains incompatible in the documented release and unknown in an unverified newer release', async ({
  page,
}) => {
  await page.goto('/#/product/IE-3500-8T3S-E');
  const panel = page.locator('.expansion-panel');
  await panel
    .getByLabel('Configuration management mode')
    .selectOption('meraki');
  await panel.getByLabel('Configuration firmware').fill('26.1.1');
  await panel.getByLabel('Required physical ports', { exact: true }).fill('16');
  await panel
    .getByRole('button', { name: 'Add IEM-3500-8T=', exact: true })
    .click();
  await expect(panel.locator('.configuration-result .badge')).toHaveText(
    'Verified incompatible',
  );
  await expect(
    panel
      .locator('.configuration-totals')
      .getByRole('row', { name: /^Physical Ethernet/ })
      .locator('td'),
  ).toHaveText(['11', '8', '19', '11']);
  await panel.getByLabel('Configuration firmware').fill('26.2.1');
  await expect(panel.locator('.configuration-result .badge')).toHaveText(
    'Not yet verified',
  );
  await expect(
    panel
      .locator('.configuration-totals')
      .getByRole('row', { name: /^Physical Ethernet/ })
      .locator('td'),
  ).toHaveText(['11', '8', '19', '11']);
});

test('expanded hardware configuration is usable on mobile and passes automated accessibility checks', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/product/IE-3400-8P2S-E');
  const panel = page.locator('.expansion-panel');
  await panel
    .getByRole('button', { name: 'Add IEM-3400-8P=', exact: true })
    .click();
  await panel.getByLabel('Required PoE load (W)').fill('481');
  await expect(panel.locator('.configuration-result .badge')).toHaveText(
    'Verified incompatible',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const analysis = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    analysis.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
test('catalog table and category filters work', async ({ page }) => {
  await page.goto('/#/catalog');
  await page.getByRole('button', { name: 'Routing', exact: true }).click();
  await expect(page.locator('.product-card:not(.research-card)')).toHaveCount(
    10,
  );
  await page.getByRole('button', { name: 'Table view' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Wireless', exact: true }).click();
  await expect(page.locator('.research-card')).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(
    page.getByText('IW9165 regulatory / operating-mode ordering', {
      exact: true,
    }),
  ).toBeVisible();
});
test('requirements reset and keyboard search work', async ({ page }) => {
  await page.goto('/');
  const ports = page.getByRole('spinbutton', {
    name: 'Min. dedicated copper ports',
  });
  await ports.fill('16');
  await page.getByRole('checkbox', { name: 'Cyber Vision support' }).check();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(ports).toHaveValue('');
  await expect(
    page.getByRole('checkbox', { name: 'Cyber Vision support' }),
  ).not.toBeChecked();
  await page.locator('h1').click();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeFocused();
});
test('comparison refuses unverified candidates and software preserves unknowns', async ({
  page,
}) => {
  await page.goto('/#/compare');
  await expect(
    page.getByRole('heading', { name: 'Your comparison starts with evidence' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Export/ })).toHaveCount(0);
  await page.goto('/#/software');
  await expect(
    page.getByRole('heading', { name: 'Cyber Vision', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Unknown', { exact: true })).toHaveCount(4);
  await expect(
    page.getByRole('heading', { name: 'Included entitlement evidence' }),
  ).toBeVisible();
});
test('audit distinguishes source retrieval from scoped source review', async ({
  page,
}) => {
  await page.goto('/#/audit');
  await expect(
    page.getByRole('heading', {
      name: 'Official sources · scoped technical review',
    }),
  ).toBeVisible();
  await expect(
    page.locator('.source-row').getByText('Source reviewed', { exact: true }),
  ).toHaveCount(39);
  await expect(
    page.getByRole('heading', {
      name: 'IE3505 PoE ordering table duplicates the -A PID',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Sources reviewed', { exact: true }),
  ).toBeVisible();
});
test('mobile menu, record links and layout remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('checkbox', { name: 'DIN rail mounting' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Catalog', exact: true })
    .click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'IE-3500-8T3S-A', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'IE-3500-8T3S-A', exact: true }),
  ).toBeVisible();
});
test('missing and malformed product deep links show not found', async ({
  page,
}) => {
  await page.goto('/#/product/nonexistent');
  await expect(
    page.getByRole('heading', { name: 'Record not found' }),
  ).toBeVisible();
  await page.goto('/#/product/%ZZ');
  await expect(
    page.getByRole('heading', { name: 'Record not found' }),
  ).toBeVisible();
});

test('synthetic reviewed products support exact-PID detail and 2-PID comparison with CSV', async ({
  page,
}) => {
  // Intercept only the dev-server data module. No test product enters committed data or production builds.
  const c = fixtureCatalog();
  c.pids.push({ ...product, id: 'test-switch', pid: 'TEST-SWITCH-16' });
  c.assertions.push(
    assertion({ id: 'ports-router' }),
    assertion({ id: 'ports-switch', subjectId: 'test-switch', value: 16 }),
  );
  await page.route('**/data/products/catalog.json*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `export default ${JSON.stringify(c)};`,
    }),
  );
  await page.route('**/data/sources/sources.json*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `export default ${JSON.stringify([source])};`,
    }),
  );
  await page.goto('/#/catalog');
  await page.getByRole('button', { name: 'Add to comparison' }).first().click();
  await page.getByRole('button', { name: 'Add to comparison' }).click();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /Compare/ })
    .click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: /TEST-ROUTER-2/ }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV with sources' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('iiot-comparison.csv');
  await page.getByRole('link', { name: 'TEST-ROUTER-2', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'TEST-ROUTER-2', exact: true }),
  ).toBeVisible();
  await page.getByText('Evidence · published', { exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'View official source' }).first(),
  ).toHaveAttribute('href', source.url);
});

for (const route of ['selector', 'software', 'product/IR1005-G2']) {
  test(`automated accessibility check: ${route}`, async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright');
    await page.goto(`/#/${route}`);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
}

test('legacy lifecycle warnings and official replacement links remain discoverable', async ({
  page,
}) => {
  await page.goto('/#/product/IE-3000-8TC');
  await expect(
    page.getByText('end-of-support', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'IE-3300-8T2S-E →', exact: true }),
  ).toBeVisible();
  await page.goto('/');
  await page.getByRole('searchbox').fill('IE-3000-8TC');
  await expect(
    page.getByRole('heading', { name: 'No eligible products found' }),
  ).toBeVisible();
  await page.getByRole('checkbox', { name: /Show excluded products/ }).check();
  await expect(
    page.getByRole('link', { name: 'IE-3000-8TC', exact: true }),
  ).toBeVisible();
  await page.getByText('Why this result?', { exact: true }).click();
  await expect(
    page.getByText('Verified incompatible', { exact: true }).first(),
  ).toBeVisible();
});
test('advanced technical filters and family selection preserve explicit uncertainty', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'Product family', exact: true })
    .selectOption('ir1800');
  await expect(page.locator('.product-card:not(.research-card)')).toHaveCount(
    2,
  );
  await page
    .getByText('Technical & licensing requirements', { exact: true })
    .click();
  await page
    .getByRole('checkbox', { name: 'Cyber Vision support', exact: true })
    .check();
  await page
    .getByRole('checkbox', {
      name: 'SEA / Cyber Vision SRA support',
      exact: true,
    })
    .check();
  await page
    .getByRole('combobox', { name: 'Security deployment architecture' })
    .selectOption('separate-cv-sea-agents');
  await expect(
    page.getByRole('heading', { name: 'No eligible products found' }),
  ).toBeVisible();
  await page.getByRole('checkbox', { name: /Show excluded products/ }).check();
  await page.getByText('Why this result?', { exact: true }).first().click();
  await expect(
    page
      .getByText('Cyber Vision + SEA simultaneous deployment', { exact: true })
      .first(),
  ).toBeVisible();
});
test('family reference never promotes a wildcard wireless SKU and audit history is downloadable', async ({
  page,
}) => {
  await page.goto('/#/family/iw9165');
  await expect(
    page.getByRole('heading', { name: 'IW9165', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Exact identity / ordering unresolved'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add to comparison' }),
  ).toHaveCount(0);
  await page.goto('/#/audit');
  await expect(
    page.getByRole('heading', { name: 'Portfolio coverage by family' }),
  ).toBeVisible();
  const report = page.locator('a[href*="/data/audits/"]').first();
  await expect(report).toHaveAttribute('target', '_blank');
  const response = await page.request.get(
    (await report.getAttribute('href')) ?? '',
  );
  expect(response.ok()).toBe(true);
  expect((await response.json()).summary.sourcesChecked).toBe(39);
  const historical = page.locator('a[href*="/data/audits/"]').last();
  const previous = await page.request.get(
    (await historical.getAttribute('href')) ?? '',
  );
  expect(previous.ok()).toBe(true);
  expect((await previous.json()).summary.sourcesChecked).toBe(35);
});
