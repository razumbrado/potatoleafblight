import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Database, Download, Info, KeyRound, LogOut, Mail, Moon, Palette, Save, Sun, Trash2, User, UserCog } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input, PasswordInput } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useScans } from '@/contexts/ScansContext';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { APP_NAME, APP_TAGLINE, APP_VERSION } from '@/lib/constants';
import { SCAN_BUCKET } from '@/lib/supabase';
import { newPasswordSchema, PASSWORD_HINT, profileSchema, type NewPasswordValues, type ProfileValues } from '@/lib/validation';
import { cn } from '@/utils/cn';
import { exportScansCsv } from '@/utils/csv';
import { formatDate, getErrorMessage, getInitials } from '@/utils/format';

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ProfileCard() {
  const { user, profile, displayName, updateFullName } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName: displayName } });

  // Reflect the stored name once the profile row has loaded.
  useEffect(() => {
    reset({ fullName: displayName });
  }, [displayName, reset]);

  const onSubmit = async (values: ProfileValues) => {
    try {
      await updateFullName(values.fullName);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Your profile could not be updated.'));
    }
  };

  return (
    <Card>
      <CardHeader title="User profile" description="How your name appears across BlightVision." icon={<User />} />
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-surface-alt p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pine-100 text-lg font-extrabold text-pine-700 dark:bg-subtle dark:text-pine-300">
          {getInitials(displayName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{displayName}</p>
          <p className="truncate text-sm text-ink-muted">{user?.email}</p>
          {(profile?.created_at ?? user?.created_at) && (
            <p className="mt-0.5 text-xs text-ink-faint">Member since {formatDate((profile?.created_at ?? user?.created_at)!)}</p>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input label="Full name" autoComplete="name" placeholder="Your full name" icon={<User />} error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email address" value={user?.email ?? ''} readOnly disabled icon={<Mail />} hint="Your sign-in email cannot be changed here." />
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty} icon={<Save className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AccountCard() {
  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });

  const onSubmit = async (values: NewPasswordValues) => {
    try {
      await updatePassword(values.password);
      reset();
      toast.success('Password updated.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Your password could not be updated.'));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('You have been signed out.');
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not sign out.'));
      setSigningOut(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Account settings" description="Change your password or sign out of this device." icon={<UserCog />} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} icon={<KeyRound className="h-4 w-4" />}>
            Update Password
          </Button>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <p className="text-sm font-semibold text-ink">Sign out</p>
          <p className="text-xs text-ink-muted">End your session on this device.</p>
        </div>
        <Button variant="outline" onClick={() => void handleSignOut()} loading={signingOut} icon={<LogOut className="h-4 w-4" />}>
          Log Out
        </Button>
      </div>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; icon: ReactNode; preview: string }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" />, preview: 'bg-[#F1F8F3] border-[#DCEAE1]' },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" />, preview: 'bg-[#091611] border-[#224032]' },
  ];
  return (
    <Card>
      <CardHeader title="Appearance" description="Choose the theme for this browser." icon={<Palette />} />
      <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Theme">
        {options.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={cn(
                'rounded-2xl border-2 p-3 text-left transition-all duration-200',
                selected ? 'border-accent bg-accent-soft/50 shadow-card' : 'border-line hover:border-line-strong',
              )}
            >
              <div className={cn('flex h-20 flex-col justify-between rounded-xl border p-2.5', option.preview)} aria-hidden>
                <div className={cn('h-2 w-10 rounded-full', option.value === 'light' ? 'bg-[#12372A]' : 'bg-[#74C69D]')} />
                <div className="flex gap-1.5">
                  <div className={cn('h-6 flex-1 rounded-md', option.value === 'light' ? 'bg-white' : 'bg-[#0F2119]')} />
                  <div className={cn('h-6 flex-1 rounded-md', option.value === 'light' ? 'bg-white' : 'bg-[#0F2119]')} />
                </div>
              </div>
              <span className="mt-3 flex items-center gap-2 text-sm font-bold text-ink">
                {option.icon}
                {option.label}
                {selected && <span className="ml-auto text-xs font-semibold text-accent">Active</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function DataCard() {
  const { scans, loading, clearAll } = useScans();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExport = () => {
    if (scans.length === 0) {
      toast.error('There are no saved scans to export.');
      return;
    }
    exportScansCsv(scans);
    toast.success(`Exported ${scans.length} ${scans.length === 1 ? 'scan' : 'scans'} to CSV.`);
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const count = await clearAll();
      toast.success(count === 1 ? '1 scan removed from your history.' : `${count} scans removed from your history.`);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Your history could not be cleared.'));
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Your data" description="Export or remove the scans stored in your account." icon={<Database />} />
      <div className="rounded-2xl bg-surface-alt p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Saved scans</p>
        <p className="tabular mt-1 text-3xl font-extrabold text-ink">{loading && scans.length === 0 ? '…' : scans.length.toLocaleString()}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Stored in the <span className="font-mono">scan_history</span> table and the private <span className="font-mono">{SCAN_BUCKET}</span> bucket.
        </p>
      </div>
      <div className="mt-5 divide-y divide-line">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Export scan history</p>
            <p className="text-xs text-ink-muted">Download every saved scan as a CSV file.</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={scans.length === 0} icon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Clear scan history</p>
            <p className="text-xs text-ink-muted">Permanently delete all saved scans and their images.</p>
          </div>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={scans.length === 0} icon={<Trash2 className="h-4 w-4" />}>
            Clear History
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Clear your entire scan history?"
        description={`All ${scans.length} saved ${scans.length === 1 ? 'scan' : 'scans'} and their stored images will be permanently deleted. This cannot be undone.`}
        confirmLabel="Clear History"
        loading={clearing}
        onConfirm={() => void handleClear()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}

function ApplicationCard() {
  return (
    <Card>
      <CardHeader title="Application information" icon={<Info />} />
      <dl className="divide-y divide-line">
        <InfoRow label="Application" value={`${APP_NAME} – ${APP_TAGLINE}`} />
        <InfoRow label="Version" value={APP_VERSION} />
        <InfoRow label="Interface" value="React · TypeScript · Tailwind CSS" />
        <InfoRow label="AI runtime" value="Python · FastAPI · scikit-learn Random Forest" />
        <InfoRow label="Data backend" value="Supabase Auth · PostgreSQL · Storage" />
      </dl>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" description="Manage your profile, account, appearance, and saved data." />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <ProfileCard />
          <AccountCard />
        </div>
        <div className="space-y-5">
          <DataCard />
          <AppearanceCard />
          <ApplicationCard />
        </div>
      </div>
    </div>
  );
}
