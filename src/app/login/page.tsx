'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { useAuth, apiErrorMessage } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const { forcePasswordChange } = await login(values.email, values.password);
      router.push(forcePasswordChange ? '/change-password' : '/dashboard');
    } catch (e) {
      setServerError(apiErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-8">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-7">
          <div className="mx-auto mb-3 h-14 w-14 rounded-xl bg-white/10" />
          <div className="text-white text-lg font-medium">Abraj Al Yasir</div>
          <div className="text-white/50 text-xs mt-1">Task Management</div>
        </div>
        <div className="bg-white rounded-2xl p-7 shadow-2xl">
          <div className="text-base font-medium mb-5">Sign in</div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="name@abrajalyasser.iq" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>
            {serverError && <p className="text-xs text-destructive">{serverError}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
