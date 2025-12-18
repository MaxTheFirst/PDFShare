import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Загрузка файлов', () => {
  let folderId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const response = await page.request.post('/api/auth/test-login', {
      data: {
        telegramId: 'e2e_upload_user',
        username: 'e2eupload',
        firstName: 'Upload',
        lastName: 'Test',
      },
    });
    expect(response.ok()).toBeTruthy();

    const folderResponse = await page.request.post('/api/folders', {
      data: { name: 'test' },
    });
    expect(folderResponse.ok()).toBeTruthy();

    const folder = await folderResponse.json();
    folderId = folder.id;

    await page.goto(`/explorer/${folderId}`);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    if (!folderId) return;

    const deleteResponse = await page.request.delete(
      `/api/folders/${folderId}`
    );

    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('Кнопка загрузки файла должна быть видима на странице explorer', async ({ page }) => {
    const uploadButton = page.locator('[data-testid="button-upload"], button:has-text("Загрузить"), button:has-text("Upload")').first();
    
    await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
    
    expect(await uploadButton.isVisible()).toBe(true);
    expect(await uploadButton.isEnabled()).toBe(true);
  });

  test('Клик по кнопке загрузки должен открыть диалог', async ({ page }) => {
    const uploadButton = page.locator('[data-testid="button-upload"], button:has-text("Загрузить"), button:has-text("Upload")').first();
    
    await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
    await uploadButton.click();
    
    const dialog = page.locator('[data-testid="input-file-upload"]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    expect(await dialog.isVisible()).toBe(true);
  });

  test('Загрузка PDF файла', async ({ page }) => {
    const filePath = 'e2e/testdata/test.pdf';

    const fileInput = page.locator('[data-testid="input-file-upload"]');

    await fileInput.setInputFiles(filePath);

    await expect(page.getByText('Загрузка файлов')).toBeVisible();
    await expect(page.getByText('test.pdf')).toBeVisible();

    await page.click('[data-testid="button-confirm-upload"]');

    await expect(
      page.getByRole('status')
    ).toContainText('Успех');    

    await expect(page.getByText('test.pdf')).toBeVisible();
  });
});
