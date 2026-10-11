import { z } from 'zod';

const email = z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.');

/** Shared password rule: at least 8 characters with a lowercase letter, an uppercase letter, and a number. */
export const passwordRule = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[0-9]/, 'Include at least one number.');

export const PASSWORD_HINT = 'At least 8 characters, with upper- and lowercase letters and a number.';

const fullName = z
  .string()
  .trim()
  .min(2, 'Enter your full name (at least 2 characters).')
  .max(80, 'Use 80 characters or fewer.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName,
    email,
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export const profileSchema = z.object({ fullName });
export type ProfileValues = z.infer<typeof profileSchema>;
