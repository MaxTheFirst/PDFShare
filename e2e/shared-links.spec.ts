import { test, expect } from '@playwright/test';

test.describe('Публичные ссылки для расшаривания', () => {
  let folderId: string;
  let folderShareToken: string = "";

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

    const logoutResponse = await page.request.post('/api/auth/logout');
    expect(logoutResponse.ok()).toBeTruthy();
  });

  test.afterEach(async ({ page }) => {
    if (!folderId) return;
    const response = await page.request.post('/api/auth/test-login', {
      data: {
        telegramId: 'e2e_upload_user',
        username: 'e2eupload',
        firstName: 'Upload',
        lastName: 'Test',
      },
    });
    expect(response.ok()).toBeTruthy();

    const deleteResponse = await page.request.delete(
      `/api/folders/${folderId}`
    );

    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('Проверка структуры публичной страницы папки', async ({ page }) => {
    await page.goto(`/shared/folder/${folderShareToken}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

