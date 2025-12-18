import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Карточка</CardTitle>
        <CardDescription>Описание карточки</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Содержимое карточки находится здесь.</p>
      </CardContent>
      <CardFooter>
        <Button>Действие</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithoutDescription: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Простая карточка</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Карточка без описания.</p>
      </CardContent>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Карточка без футера</CardTitle>
        <CardDescription>Только заголовок и содержимое</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Эта карточка не имеет футера.</p>
      </CardContent>
    </Card>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Создать аккаунт</CardTitle>
        <CardDescription>Введите свои данные ниже</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="name">Имя</label>
            <input
              id="name"
              placeholder="Иван Иванов"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="ivan@example.com"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline">Отмена</Button>
        <Button>Создать</Button>
      </CardFooter>
    </Card>
  ),
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Карточка 1</CardTitle>
          <CardDescription>Первая карточка</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Содержимое первой карточки.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Карточка 2</CardTitle>
          <CardDescription>Вторая карточка</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Содержимое второй карточки.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const FileCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>document.pdf</CardTitle>
        <CardDescription>Загружено 2 дня назад</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Размер: 2.4 МБ</p>
          <p>Версия: 3</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm">Скачать</Button>
        <Button variant="outline" size="sm">Поделиться</Button>
        <Button variant="destructive" size="sm">Удалить</Button>
      </CardFooter>
    </Card>
  ),
};
