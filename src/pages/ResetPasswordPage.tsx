import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Notice } from '@/components/common/Notice';
import { Button, buttonStyles } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { newPasswordSchema, PASSWORD_HINT, type NewPasswordValues } from '@/lib/validation';
import { getErrorMessage } from '@/utils/format';

export function ResetPasswordPage() {
  const { user, loading, updatePassword, configured } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  // The recovery link signs the user in asynchronously; give it a moment before declaring it invalid.
  const [settled, setSettled] = useState(false);
  // Supabase reports expired or already-used links in the URL fragment.
  const [linkError] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return params.get('error_description')?.replace(/\+/g, ' ') ?? null;
  });

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async (values: NewPasswordValues) => {
    setFormError(null);
    try {
      await updatePassword(values.password);
      toast.success('Your password has been updated.');
      navigate('/detect', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not update your password.'));
    }
  };

  if (configured && !user && !linkError && (loading || !settled)) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-ink-muted">Verifying your reset link…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <ShieldAlert className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">This reset link isn’t valid</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {linkError ?? 'The link may have expired or already been used.'} Request a new one to choose a new password.
        </p>
        <Link to="/forgot-password" className={buttonStyles({ size: 'lg', className: 'mt-8 w-full' })}>
          Request a New Link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Setting a new password for <span className="font-semibold text-ink">{user.email}</span>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {formError && (
          <Notice tone="danger">
            <span role="alert">{formError}</span>
          </Notice>
        )}
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          placeholder="Create a new password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<KeyRound className="h-4 w-4" />}>
          {isSubmitting ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}
