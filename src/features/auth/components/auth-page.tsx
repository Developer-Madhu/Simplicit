"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icons } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/features/auth/context/toast-context";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  type SignInSchema,
  type SignUpSchema,
  type ForgotPasswordSchema,
} from "@/features/auth/lib/validation";

// Token helpers for code highlighting
const T = {
  kw: (s: string) => `<span class="tok-kw">${s}</span>`,
  fn: (s: string) => `<span class="tok-fn">${s}</span>`,
  str: (s: string) => `<span class="tok-str">${s}</span>`,
  num: (s: string) => `<span class="tok-num">${s}</span>`,
  cmt: (s: string) => `<span class="tok-cmt">${s}</span>`,
  type: (s: string) => `<span class="tok-type">${s}</span>`,
  prop: (s: string) => `<span class="tok-prop">${s}</span>`,
};

const SF_CODE_ROUTES = [
  `${T.cmt('// apps/api/src/modules/exams/routes.ts')}`,
  `${T.kw('import')} { ${T.fn('Hono')} } ${T.kw('from')} ${T.str("'hono'")}`,
  `${T.kw('import')} { ${T.fn('z')} } ${T.kw('from')} ${T.str("'zod'")}`,
  `${T.kw('import')} { ${T.fn('requireAuth')} } ${T.kw('from')} ${T.str("'@/middleware/auth'")}`,
  `${T.kw('import')} { examService } ${T.kw('from')} ${T.str("'./service'")}`,
  ``,
  `${T.kw('export const')} ${T.prop('router')} = ${T.kw('new')} ${T.fn('Hono')}()`,
  ``,
  `${T.prop('router')}.${T.fn('post')}(${T.str("'/'")}, ${T.fn('requireAuth')}(${T.str("'instructor'")}), ${T.kw('async')} (c) => {`,
  `  ${T.kw('const')} ${T.prop('body')} = ${T.kw('await')} c.${T.fn('req')}.${T.fn('json')}()`,
  `  ${T.kw('const')} ${T.prop('parsed')} = ${T.prop('CreateExam')}.${T.fn('parse')}(${T.prop('body')})`,
  `  ${T.kw('const')} ${T.prop('exam')} = ${T.kw('await')} examService.${T.fn('create')}(${T.prop('parsed')})`,
  `  ${T.kw('return')} c.${T.fn('json')}({ ${T.prop('exam')} }, ${T.num('201')})`,
  `})`,
];

interface CodeBlockProps {
  language?: string;
  lines: string[];
  showLineNumbers?: boolean;
  scroll?: boolean;
  height?: number | string;
  title?: string;
  actions?: ReactNode;
}

function CodeBlock({
  language = "ts",
  lines = [],
  showLineNumbers = true,
  scroll = false,
  height,
  title,
  actions
}: CodeBlockProps) {
  return (
    <div className="sf-code" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {(title || actions) && (
        <div className="sf-row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--sf-border)', gap: 8, background: 'var(--sf-surface)', flex: '0 0 auto' }}>
          {title && <span className="mono" style={{ fontSize: 11, color: 'var(--sf-text-muted)' }}>{title}</span>}
          <span className="sf-chip sf-chip-mono" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>{language}</span>
          <span className="sf-grow" />
          {actions}
        </div>
      )}
      <pre className="sf-scroll" style={{
        margin: 0, padding: '12px 14px', overflow: scroll ? 'auto' : 'hidden',
        height: height, flex: '1 1 auto', whiteSpace: 'pre',
      }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ minHeight: '1.65em' }}>
            {showLineNumbers && <span className="ln">{i + 1}</span>}
            <span dangerouslySetInnerHTML={{ __html: ln }} />
          </div>
        ))}
      </pre>
    </div>
  );
}

function SFLogo({ size = 22, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="sf-row" style={{ gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="sf-mg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={1}/>
            <stop offset="1" stopColor="#fff" stopOpacity={0.55}/>
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#16161A" stroke="rgba(255,255,255,0.12)"/>
        <path d="M7 8.5 12 6l5 2.5L12 11 7 8.5Z" fill="url(#sf-mg)"/>
        <path d="M7 12 12 14.5 17 12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
        <path d="M7 15.5 12 18 17 15.5" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      </svg>
      {withText && (
        <span style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 14 }}>
          Simplicit
        </span>
      )}
    </div>
  );
}

interface AuthShellProps {
  children: ReactNode;
  footnote?: ReactNode;
}

function AuthShell({ children, footnote }: AuthShellProps) {
  return (
    <div className="sf-app" style={{ width: '100%', minHeight: '100vh', display: 'flex', background: 'var(--sf-bg)' }}>
      {/* Left brand panel - visible on lg screens */}
      <div style={{
        flex: '1 1 0', minWidth: 0, position: 'relative', overflow: 'hidden',
        background: 'var(--sf-bg-2)', borderRight: '1px solid var(--sf-border)',
        display: 'flex', flexDirection: 'column', padding: 48,
      }} className="hidden lg:flex">
        <div className="sf-linegrid" style={{
          position: 'absolute', inset: 0, opacity: 0.55,
          maskImage: 'radial-gradient(ellipse 80% 70% at 30% 50%, black, transparent 80%)',
        }} />
        <div aria-hidden style={{
          position: 'absolute', left: '20%', top: '20%', width: 380, height: 380,
          background: 'radial-gradient(circle, oklch(0.4 0.12 250 / 0.32), transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <SFLogo />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', maxWidth: 460 }}>
          <span className="sf-chip" style={{ alignSelf: 'flex-start', marginBottom: 22 }}>
            <span className="sf-dot sf-dot--green" /> v2.4 · Architect agents
          </span>
          <h1 style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 500, margin: 0 }}>
            Backend foundations,<br/>generated by an AI architect.
          </h1>
          <p className="sf-muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 18 }}>
            From a single prompt to a real, opinionated codebase you can defend in review.
          </p>

          {/* Mini code mock */}
          <div className="sf-card-elev" style={{ marginTop: 36, padding: 0, overflow: 'hidden' }}>
            <div className="sf-row" style={{ padding: '8px 14px', gap: 8, borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
              <span className="sf-dot" style={{ background: '#3a3a3f' }} />
              <span className="sf-dot" style={{ background: '#3a3a3f' }} />
              <span className="sf-dot" style={{ background: '#3a3a3f' }} />
              <span className="mono sf-faint" style={{ fontSize: 10.5, marginLeft: 8 }}>routes.ts</span>
            </div>
            <CodeBlock language="ts" lines={SF_CODE_ROUTES.slice(0, 12)} height={180} scroll showLineNumbers />
          </div>
        </div>

        <div className="sf-row" style={{ gap: 12, color: 'var(--sf-text-faint)', fontSize: 12, position: 'relative' }}>
          <span>SOC 2 Type II</span>
          <span className="sf-faint">·</span>
          <span>Self-host the output</span>
          <span className="sf-faint">·</span>
          <span>MIT-licensed exports</span>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column' }} className="w-full lg:max-w-[560px]">
        <div style={{ flex: 1, padding: '60px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="sf-row" style={{ marginBottom: 20 }}>
            {/* Show brand on small screens when left panel is hidden */}
            <div className="lg:hidden">
              <SFLogo />
            </div>
            <span className="sf-grow" />
            <a className="sf-faint" style={{ fontSize: 12.5 }} href="mailto:support@simplicit.dev">Need help? <span style={{ color: 'var(--sf-text)' }}>Contact us</span></a>
          </div>
          {children}
          {footnote}
        </div>
      </div>
    </div>
  );
}

function OAuthRow({ onOAuthClick }: { onOAuthClick: (provider: 'github' | 'google' | 'apple') => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      <button className="sf-btn" style={{ justifyContent: 'center' }} type="button" onClick={() => onOAuthClick('github')}>
        <Icons.Github size={13} /> GitHub
      </button>
      <button className="sf-btn" style={{ justifyContent: 'center' }} type="button" onClick={() => onOAuthClick('google')}>
        <svg width="13" height="13" viewBox="0 0 24 24">
          <path fill="currentColor" d="M21.6 11.3c0-.7-.1-1.3-.2-2H12v3.7h5.4c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 3-4.3 3-7Z"/>
          <path fill="currentColor" opacity=".7" d="M12 22c2.7 0 5-1 6.6-2.7l-3.2-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/>
          <path fill="currentColor" opacity=".5" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z"/>
          <path fill="currentColor" opacity=".3" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.6l3.3 2.6C7.2 7.8 9.4 5.9 12 5.9Z"/>
        </svg>
        Google
      </button>
      <button className="sf-btn" style={{ justifyContent: 'center' }} type="button" onClick={() => onOAuthClick('apple')}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.6 12.7c0-2.4 2-3.6 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1.1 1.6 2.3 2.8 2.3 1.1 0 1.5-.7 2.9-.7s1.7.7 2.9.7c1.2 0 2-1.1 2.7-2.2.8-1.3 1.2-2.5 1.2-2.6 0 0-2-.7-2-3.3ZM15.5 5.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-1 2.6 1 .1 2-.5 2.7-1.2Z"/>
        </svg>
        Apple
      </button>
    </div>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  trailing?: ReactNode;
  error?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, hint, trailing, error, style, ...props }, ref) => {
    return (
      <div style={{ marginBottom: 14 }}>
        <div className="sf-row" style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>{label}</label>
          <span className="sf-grow" />
          {trailing}
        </div>
        <input
          ref={ref}
          className="sf-input"
          style={{
            height: 38,
            fontSize: 13.5,
            borderColor: error ? 'var(--sf-red)' : 'var(--sf-border)',
            ...style,
          }}
          {...props}
        />
        {error && <div style={{ fontSize: 11.5, color: 'var(--sf-red)', marginTop: 5 }}>{error}</div>}
        {hint && !error && <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 5 }}>{hint}</div>}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams ? searchParams.get("next") || "/workspace" : "/workspace";
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "alex@acmestudio.com",
      password: "",
      keepSignedIn: true,
    },
  });

  const keepSignedIn = watch("keepSignedIn");

  const onSubmit = async (data: SignInSchema) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast(error.message, "error");
      } else {
        toast("Welcome back!", "success");
        router.push(nextPath);
        router.refresh();
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'github' | 'google' | 'apple') => {
    if (provider === 'apple') {
      toast("OAuth via Apple is pending configuration.", "info");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        toast(error.message, "error");
        setLoading(false);
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred.", "error");
      setLoading(false);
    }
  };

  return (
    <AuthShell footnote={
      <p className="sf-faint" style={{ fontSize: 12, textAlign: 'center', marginTop: 'auto' }}>
        By signing in you agree to our <span style={{ color: 'var(--sf-text-muted)' }}>Terms</span> and <span style={{ color: 'var(--sf-text-muted)' }}>Privacy Policy</span>.
      </p>
    }>
      <form onSubmit={handleSubmit(onSubmit)} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Welcome back</h2>
        <p className="sf-muted" style={{ fontSize: 14, marginBottom: 28 }}>Sign in to your Simplicit workspace.</p>

        <OAuthRow onOAuthClick={handleOAuthClick} />
        <div className="sf-row" style={{ gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sf-border)' }} />
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sf-border)' }} />
        </div>

        <FormField label="Work email" error={errors.email?.message} {...register("email")} />
        <FormField
          label="Password"
          type="password"
          error={errors.password?.message}
          trailing={<Link href="/forgot-password" className="sf-faint" style={{ fontSize: 11.5 }}>Forgot?</Link>}
          {...register("password")}
        />

        <label
          className="sf-row"
          style={{ gap: 8, marginTop: 16, fontSize: 12.5, color: 'var(--sf-text-muted)', cursor: 'pointer' }}
          onClick={() => setValue("keepSignedIn", !keepSignedIn)}
        >
          <span style={{
            width: 14, height: 14, borderRadius: 3,
            background: keepSignedIn ? 'var(--sf-text)' : 'transparent',
            border: keepSignedIn ? 'none' : '1px solid var(--sf-border-strong)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sf-bg)',
            transition: 'background .15s, border-color .15s',
          }}>
            {keepSignedIn && <Icons.Check size={10} />}
          </span>
          Keep me signed in for 30 days
        </label>

        <button
          className="sf-btn sf-btn--primary sf-btn--lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 24, opacity: loading ? 0.7 : 1 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"} {!loading && <Icons.ArrowR size={12} />}
        </button>

        <p className="sf-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 22 }}>
          New here? <Link href="/sign-up" style={{ color: 'var(--sf-text)', cursor: 'pointer' }}>Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "Alex",
      lastName: "Chen",
      email: "alex@acmestudio.com",
      password: "",
    },
  });

  const onSubmit = async (data: SignUpSchema) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) {
        toast(error.message, "error");
      } else {
        if (authData.session) {
          toast("Successfully created account!", "success");
          router.push("/workspace");
        } else {
          toast("Check your email inbox for confirmation link.", "success");
        }
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = async (provider: 'github' | 'google' | 'apple') => {
    if (provider === 'apple') {
      toast("OAuth via Apple is pending configuration.", "info");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/workspace`,
        },
      });
      if (error) {
        toast(error.message, "error");
        setLoading(false);
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred.", "error");
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="sf-chip" style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
          <span className="sf-dot sf-dot--green" /> Free during public beta
        </span>
        <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Create your workspace</h2>
        <p className="sf-muted" style={{ fontSize: 14, marginBottom: 28 }}>Generate your first backend in under a minute.</p>

        <OAuthRow onOAuthClick={handleOAuthClick} />
        <div className="sf-row" style={{ gap: 12, margin: '22px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--sf-border)' }} />
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--sf-border)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="First name" error={errors.firstName?.message} {...register("firstName")} />
          <FormField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <FormField label="Work email" error={errors.email?.message} {...register("email")} />
        <FormField label="Password" type="password" hint="At least 12 characters" error={errors.password?.message} {...register("password")} />

        <div className="sf-row" style={{ gap: 8, marginTop: 16, padding: 12, background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8 }}>
          <Icons.Lock size={13} className="sf-muted" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>
            Your prompts are private. We never train models on your generations.
          </span>
        </div>

        <button
          className="sf-btn sf-btn--primary sf-btn--lg"
          style={{ width: '100%', justifyContent: 'center', marginTop: 22, opacity: loading ? 0.7 : 1 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create workspace"} {!loading && <Icons.ArrowR size={12} />}
        </button>
        <p className="sf-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
          Already have an account? <Link href="/sign-in" style={{ color: 'var(--sf-text)', cursor: 'pointer' }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "alex@acmestudio.com",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setLoading(true);
    setEmailValue(data.email);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/sign-in`,
      });

      if (error) {
        toast(error.message, "error");
      } else {
        setSubmitted(true);
        toast("Magic link successfully sent!", "success");
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Link href="/sign-in" className="sf-btn sf-btn--ghost sf-btn--sm" style={{ alignSelf: 'flex-start', marginBottom: 22, padding: '0 6px' }}>
          ← Back to sign in
        </Link>
        <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Reset your password</h2>
        
        {submitted ? (
          <div style={{ marginTop: 18 }}>
            <div className="sf-card" style={{ padding: 16, background: 'var(--sf-surface)' }}>
              <div className="sf-row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 999, background: 'rgba(120,200,120,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sf-green)', flexShrink: 0
                }}>
                  <Icons.Check size={12} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>Magic link sent!</div>
                  <p className="sf-muted" style={{ fontSize: 12.5, margin: '6px 0 0', lineHeight: 1.45 }}>
                    We have sent a login link to <strong>{emailValue}</strong>. Check your spam folder if you do not receive it in a few minutes.
                  </p>
                </div>
              </div>
            </div>
            <button
              className="sf-btn sf-btn--primary sf-btn--lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 22 }}
              onClick={() => router.push("/sign-in")}
              type="button"
            >
              Return to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <p className="sf-muted" style={{ fontSize: 14, marginBottom: 28 }}>
              We&apos;ll send a magic link to your work email — no password required.
            </p>

            <FormField label="Work email" error={errors.email?.message} {...register("email")} />

            <div className="sf-card" style={{ marginTop: 20, padding: 14, background: 'var(--sf-surface)' }}>
              <div className="sf-row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <Icons.Info size={14} className="sf-muted" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12.5 }}>Magic links expire in 15 minutes</div>
                  <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 2 }}>
                    The same link signs you in and resets your password.
                  </div>
                </div>
              </div>
            </div>

            <button
              className="sf-btn sf-btn--primary sf-btn--lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 22, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
