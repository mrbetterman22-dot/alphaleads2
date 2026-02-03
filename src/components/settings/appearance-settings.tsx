'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Moon, Sun } from 'lucide-react';

export function AppearanceSettings() {
  const { setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="font-medium text-sm">Theme</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setTheme('light')}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button variant="outline" onClick={() => setTheme('dark')}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
