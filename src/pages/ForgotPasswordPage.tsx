import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail, MailCheck, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Notice } from '@/components/common/Notice';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation';
import { getErrorMessage } from '@/utils/format';

export function ForgotPasswordPage() {
  const { sendPasswordReset, configured } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    try {
      await sendPasswordReset(values.email);
      setSentTo(values.email.trim());
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not send the reset email.'));
    }
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MailCheck className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-ink">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, a password reset link is on its
          way. The link opens a page where you can choose a new password.
        </p>
        <Link to="/login" className={buttonStyles({ size: 'lg', className: 'mt-8 w-full' })}>
          Back to Sign In
        </Link>
        <button type="button" onClick={() => setSentTo(null)} className="mt-4 text-sm font-semibold text-accent hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">Enter your account email and we’ll send you a link to reset it.</p>

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
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!configured} icon={<Send className="h-4 w-4" />}>
          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>

      <Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Sign In
      </Link>
    </div>
  );
}
