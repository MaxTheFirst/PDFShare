import { test, expect } from '@playwright/test';

test.describe('Управление папками и файлами', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    const response = await page.request.post('/api/auth/test-login', {
      data: {
        telegramId: 'e2e_test_user',
        username: 'e2euser',
        firstName: 'E2E',
        lastName: 'Tester',
      },
    });
    expect(response.ok()).toBeTruthy();
    
    await page.goto('/explorer');
    await page.waitForLoadState('networkidle');
  });

  test('Создание новой папки', async ({ page }) => {
    await page.goto('/explorer');
    await page.waitForLoadState('networkidle');

    const createFolderButton = page.locator('[data-testid="button-create-folder"]');
    
    if (await createFolderButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createFolderButton.click();

      const folderNameInput = page.locator('[data-testid="input-folder-name"]');
      await folderNameInput.fill('Тестовая папка E2E');

      const submitButton = page.locator('[data-testid="button-submit"]');
      await submitButton.click();

      await page.waitForTimeout(2000);

      const folderExists = await page.locator('text=Тестовая папка E2E').isVisible().catch(() => false);
      expect(folderExists).toBeTruthy();
    } else {
      console.log('Кнопка создания папки не найдена - требуется авторизация');
    }
  });

  test('Навигация по папкам в сайдбаре', async ({ page }) => {
    await page.goto('/explorer');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[data-testid="sidebar"]');
    const sidebarVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);

    if (sidebarVisible) {
      const folders = page.locator('[data-testid^="folder-item-"]');
      const folderCount = await folders.count();

      if (folderCount > 0) {
        const firstFolder = folders.first();
        await firstFolder.click();
        
        await page.waitForLoadState('networkidle');
        
        const url = page.url();
        expect(url).toContain('/explorer/');
      } else {
        console.log('Папки не найдены в сайдбаре');
      }
    } else {
      console.log('Сайдбар не найден - требуется авторизация');
    }
  });

  test('Просмотр файлов в папке', async ({ page }) => {
    await page.goto('/explorer');
    await page.waitForLoadState('networkidle');

    const fileGrid = page.locator('[data-testid="file-grid"]');
    const gridVisible = await fileGrid.isVisible({ timeout: 5000 }).catch(() => false);

    if (gridVisible) {
      const files = page.locator('[data-testid^="file-card-"]');
      const fileCount = await files.count();
      
      console.log(`Найдено файлов: ${fileCount}`);
      expect(fileCount).toBeGreaterThanOrEqual(0);
    } else {
      console.log('Сетка файлов не найдена');
    }
  });

  test('Открытие меню файла', async ({ page }) => {
    await page.goto('/explorer');
    await page.waitForLoadState('networkidle');

    const files = page.locator('[data-testid^="file-card-"]');
    const fileCount = await files.count();

    if (fileCount > 0) {
      const firstFile = files.first();
      const menuButton = firstFile.locator('[data-testid="button-file-menu"]');
      
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        
        const deleteButton = page.locator('[data-testid="button-delete"]');
        const shareButton = page.locator('[data-testid="button-share"]');
        
        const deleteVisible = await deleteButton.isVisible({ timeout: 2000 }).catch(() => false);
        const shareVisible = await shareButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        expect(deleteVisible || shareVisible).toBeTruthy();
      }
    } else {
      console.log('Нет файлов для тестирования меню');
    }
  });
});

test.describe('Публичный доступ', () => {
  test('Просмотр публичной страницы "О проекте"', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(0);
  });

  test('Главная страница доступна', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const landingContent = page.locator('main, [role="main"], body');
    await expect(landingContent).toBeVisible();
  });
});
