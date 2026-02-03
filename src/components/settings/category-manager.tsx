'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Category as CategoryType } from '@/lib/types';
import { Trash2, Edit, PlusCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-provider';

export function CategoryManager() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useData();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    addCategory(newCategoryName);
    setNewCategoryName('');
    toast({
      title: 'Category added',
      description: `"${newCategoryName}" has been created.`,
    });
  };

  const handleDeleteCategory = (id: string) => {
    const categoryName = categories.find((c) => c.id === id)?.name;
    deleteCategory(id);
    toast({
      title: 'Category removed',
      description: `"${categoryName}" has been removed.`,
    });
  };

  const handleEditStart = (category: CategoryType) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleEditSave = () => {
    if (!editingCategoryId || editingCategoryName.trim() === '') return;
    updateCategory(editingCategoryId, editingCategoryName);
    setEditingCategoryId(null);
    setEditingCategoryName('');
    toast({
      title: 'Category updated',
      description: `Category has been renamed to "${editingCategoryName}".`,
    });
  };
  
  const displayCategories = categories.filter(
    (c) => c.id !== 'income' && c.id !== 'uncategorized' && c.id !== 'transfer'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>
          Add, edit, or remove your custom spending categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              onKeyUp={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2 rounded-md border p-2">
            {displayCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {Icon && typeof Icon === 'function' && <Icon className="h-5 w-5 text-muted-foreground" />}
                    {editingCategoryId === category.id ? (
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        className="h-8"
                        onKeyUp={(e) => e.key === 'Enter' && handleEditSave()}
                      />
                    ) : (
                      <span className="text-sm font-medium">{category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingCategoryId === category.id ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleEditSave}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleEditStart(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
