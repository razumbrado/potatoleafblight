import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck, User, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Notice } from '@/components/common/Notice';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { PASSWORD_HINT, registerSchema, type RegisterValues } from '@/lib/validation';
import { getErrorMessage } from '@/utils/format';

export function RegisterPage() {
  const { signUp, user, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/detect';
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const onSubmit = async (values: RegisterValues) => {
    setFormError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values.fullName, values.email, values.password);
      if (needsEmailConfirmation) {
        setConfirmationEmail(values.email.trim());
      } else {
        toast.success('Account created — welcome to BlightVision!');
      }
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create your account.'));
    }
  };

  if (confirmationEmail) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MailCheck className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          We sent a confirmation link to <span className="font-semibold text-ink">{confirmationEmail}</span>. Open it to
          activate your account, then sign in.
        </p>
        <Link to="/login" className={buttonStyles({ size: 'lg', className: 'mt-8 w-full' })}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Get started</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Create your account</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">Save classifications to a private cloud history and track them over time.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {formError && (
          <Notice tone="danger">
            <span role="alert">{formError}</span>
          </Notice>
        )}
        <Input label="Full name" autoComplete="name" placeholder="e.g. Maria Santos" icon={<User />} error={errors.fullName?.message} {...register('fullName')} />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!configured} icon={<UserPlus className="h-4 w-4" />}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
