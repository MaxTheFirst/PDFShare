import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { ChevronRight, Mail } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Кнопка',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Удалить',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Контурная',
    variant: 'outline',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Вторичная',
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Призрачная',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Ссылка',
    variant: 'link',
  },
};

export const Small: Story = {
  args: {
    children: 'Маленькая',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Большая',
    size: 'lg',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail className="mr-2 h-4 w-4" />
        Отправить email
      </>
    ),
  },
};

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <ChevronRight className="h-4 w-4" />,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Отключена',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: 'Загрузка...',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex gap-2">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  ),
};
