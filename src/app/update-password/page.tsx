'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your password has been updated.',
      });
      router.push('/dashboard');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-4 text-center">Set New Password</h1>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}