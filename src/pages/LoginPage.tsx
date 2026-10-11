import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Notice } from '@/components/common/Notice';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { getErrorMessage } from '@/utils/format';

export function LoginPage() {
  const { signIn, user, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/detect';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  // Already signed in (or just signed in): continue to where the visitor was heading.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      toast.success('Welcome back!');
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not sign you in.'));
    }
  };

  return (
    <div>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Sign in to BlightVision</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">Access your saved scans, history, and analytics.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {formError && (
          <Notice tone="danger">
            <span role="alert">{formError}</span>
          </Notice>
        )}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-semibold text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!configured} icon={<LogIn className="h-4 w-4" />}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        New to BlightVision?{' '}
        <Link to="/register" state={location.state} className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-ink-muted">
        Just exploring?{' '}
        <Link to="/detect" className="font-semibold text-accent hover:underline">
          Try detection without an account
        </Link>
      </p>
    </div>
  );
}
