import { test, expect } from '@playwright/test';
import { assertion, fixtureCatalog, product, source } from '../fixtures';

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
    name: 'Min. built-in copper ports',
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
  ).toHaveCount(35);
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
  expect((await response.json()).summary.sourcesChecked).toBe(35);
});
