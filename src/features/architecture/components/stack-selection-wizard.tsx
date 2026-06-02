"use client";

import { useState, useMemo, useEffect } from "react";
import { HelpCircle, ChevronRight, Check, ArrowRight, ArrowLeft, Database, Lock, HardDrive, Wallet, Layers, Cloud, Globe, MessageSquare, Wand2, XCircle } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiSupabase, SiPostgresql, SiMongodb, SiAppwrite, SiPlanetscale,
  SiClerk, SiFirebase, SiCloudinary, SiStripe, SiRazorpay,
  SiLemonsqueezy, SiPaddle, SiResend, SiSendgrid, SiVercel,
  SiRailway, SiRender, SiFlydotio, SiRabbitmq
} from "react-icons/si";
import { ArchitectureRequirements } from "../engines/architecture-requirements-engine";
import { ArchitecturePreferences } from "../types";

// Original brand icons (Simple Icons) keyed by option id, with brand colors.
// Tools without an official brand icon fall back to the category lucide icon.
const BRAND_ICONS: Record<string, { icon: IconType; color: string }> = {
  "Supabase": { icon: SiSupabase, color: "#3FCF8E" },
  "Supabase Auth": { icon: SiSupabase, color: "#3FCF8E" },
  "Supabase Storage": { icon: SiSupabase, color: "#3FCF8E" },
  "PostgreSQL": { icon: SiPostgresql, color: "#4169E1" },
  "MongoDB": { icon: SiMongodb, color: "#47A248" },
  "Appwrite": { icon: SiAppwrite, color: "#FD366E" },
  "Appwrite Auth": { icon: SiAppwrite, color: "#FD366E" },
  "Appwrite Storage": { icon: SiAppwrite, color: "#FD366E" },
  "PlanetScale": { icon: SiPlanetscale, color: "#E8E8F0" },
  "Clerk": { icon: SiClerk, color: "#6C47FF" },
  "Firebase Auth": { icon: SiFirebase, color: "#FFCA28" },
  "Cloudinary": { icon: SiCloudinary, color: "#3448C5" },
  "Stripe": { icon: SiStripe, color: "#635BFF" },
  "Razorpay": { icon: SiRazorpay, color: "#3395FF" },
  "LemonSqueezy": { icon: SiLemonsqueezy, color: "#FFC233" },
  "Paddle": { icon: SiPaddle, color: "#FFDD00" },
  "Resend": { icon: SiResend, color: "#E8E8F0" },
  "SendGrid": { icon: SiSendgrid, color: "#1A82E2" },
  "Vercel": { icon: SiVercel, color: "#E8E8F0" },
  "Railway": { icon: SiRailway, color: "#E8E8F0" },
  "Render": { icon: SiRender, color: "#46E3B7" },
  "Fly.io": { icon: SiFlydotio, color: "#8B5CF6" },
  "RabbitMQ": { icon: SiRabbitmq, color: "#FF6600" },
};

interface StackSelectionWizardProps {
  requirements: ArchitectureRequirements;
  onComplete: (preferences: ArchitecturePreferences) => void;
}

const DATABASE_OPTIONS = [
  { id: "Supabase", name: "Supabase", icon: Database, description: "PostgreSQL with realtime" },
  { id: "PostgreSQL", name: "PostgreSQL", icon: Database, description: "Standard relational DB" },
  { id: "MongoDB", name: "MongoDB", icon: Database, description: "NoSQL document store" },
  { id: "Appwrite", name: "Appwrite", icon: Database, description: "Open-source backend" },
  { id: "PlanetScale", name: "PlanetScale", icon: Database, description: "Serverless MySQL" },
  { id: "Neon", name: "Neon", icon: Database, description: "Serverless Postgres" },
];

const AUTH_OPTIONS = [
  { id: "Clerk", name: "Clerk", icon: Lock, description: "Drop-in UI and APIs" },
  { id: "Supabase Auth", name: "Supabase Auth", icon: Lock, description: "Integrated with Supabase" },
  { id: "Auth.js", name: "Auth.js", icon: Lock, description: "Open source authentication" },
  { id: "Firebase Auth", name: "Firebase Auth", icon: Lock, description: "Google's identity platform" },
  { id: "Appwrite Auth", name: "Appwrite Auth", icon: Lock, description: "Integrated with Appwrite" },
];

const STORAGE_OPTIONS = [
  { id: "Cloudinary", name: "Cloudinary", icon: HardDrive, description: "Image and video API" },
  { id: "Supabase Storage", name: "Supabase Storage", icon: HardDrive, description: "Integrated with Supabase" },
  { id: "AWS S3", name: "AWS S3", icon: HardDrive, description: "Industry standard storage" },
  { id: "Appwrite Storage", name: "Appwrite Storage", icon: HardDrive, description: "Integrated with Appwrite" },
];

const PAYMENT_OPTIONS = [
  { id: "Stripe", name: "Stripe", icon: Wallet, description: "Global payments infrastructure" },
  { id: "Razorpay", name: "Razorpay", icon: Wallet, description: "Payments for India" },
  { id: "LemonSqueezy", name: "LemonSqueezy", icon: Wallet, description: "Merchant of record" },
  { id: "Paddle", name: "Paddle", icon: Wallet, description: "SaaS payments" },
];

const EMAIL_OPTIONS = [
  { id: "Resend", name: "Resend", icon: Globe, description: "Developer-first email" },
  { id: "SendGrid", name: "SendGrid", icon: Globe, description: "Proven delivery at scale" },
  { id: "Postmark", name: "Postmark", icon: Globe, description: "Lightning fast delivery" },
  { id: "AWS SES", name: "AWS SES", icon: Globe, description: "Cost-effective sending" },
];

const QUEUE_OPTIONS = [
  { id: "BullMQ", name: "BullMQ", icon: Layers, description: "Redis-based queues" },
  { id: "Inngest", name: "Inngest", icon: Layers, description: "Serverless queues" },
  { id: "Trigger.dev", name: "Trigger.dev", icon: Layers, description: "Background jobs" },
  { id: "RabbitMQ", name: "RabbitMQ", icon: Layers, description: "Message broker" },
];

const DEPLOYMENT_OPTIONS = [
  { id: "Vercel", name: "Vercel", icon: Cloud, description: "Frontend cloud" },
  { id: "Railway", name: "Railway", icon: Cloud, description: "Deploy anywhere" },
  { id: "Render", name: "Render", icon: Cloud, description: "Cloud app hosting" },
  { id: "Fly.io", name: "Fly.io", icon: Cloud, description: "Run close to users" },
  { id: "AWS", name: "AWS", icon: Cloud, description: "Full cloud platform" },
];

export function StackSelectionWizard({
  requirements,
  onComplete,
}: StackSelectionWizardProps) {
  const [preferences, setPreferences] = useState<ArchitecturePreferences>({});
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const steps = useMemo(() => {
    return [
      { id: "database", title: "Choose Your Database", options: DATABASE_OPTIONS, allowNotRequired: false },
      { id: "authentication", title: "Choose Authentication Provider", options: AUTH_OPTIONS, allowNotRequired: false },
      { id: "storage", title: "Choose Storage Provider", options: STORAGE_OPTIONS, allowNotRequired: true },
      { id: "payments", title: "Choose Payment Provider", options: PAYMENT_OPTIONS, allowNotRequired: true },
      { id: "email", title: "Choose Email Provider", options: EMAIL_OPTIONS, allowNotRequired: true },
      { id: "queue", title: "Choose Queue / Background Jobs", options: QUEUE_OPTIONS, allowNotRequired: true },
      { id: "deployment", title: "Choose Deployment Platform", options: DEPLOYMENT_OPTIONS, allowNotRequired: false }
    ];
  }, [requirements]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex];

  useEffect(() => {
    setCustomText("");
    setIsCustomMode(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(preferences);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelect = (id: string) => {
    setPreferences(prev => ({ ...prev, [currentStep.id]: id }));
    // Auto-advance
    setTimeout(() => {
      if (currentIndex < steps.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete({ ...preferences, [currentStep.id]: id });
      }
    }, 150);
  };

  const handleCustomSelect = () => {
    setIsCustomMode(true);
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    setPreferences(prev => ({ ...prev, [currentStep.id]: customText.trim() }));
    setIsCustomMode(false);
    setCustomText("");
    handleNext();
  };

  if (!currentStep) return null;

  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);
  const selectedValue = preferences[currentStep.id as keyof ArchitecturePreferences];
  const isCustomSelected = selectedValue && !currentStep.options.find(o => o.id === selectedValue) && selectedValue !== "AUTO" && selectedValue !== "NONE";

  return (
    <div
      className="sf-card-elev"
      style={{
        padding: 0,
        overflow: "hidden",
        marginBottom: 20,
        boxShadow: "0 20px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      <div
        className="sf-row"
        style={{
          padding: "12px 16px",
          gap: 10,
          background: "var(--sf-bg-2)",
          borderBottom: "1px solid var(--sf-border)",
        }}
      >
        <Layers size={14} style={{ color: "var(--sf-blue)" }} />
        <div className="sf-row" style={{ gap: 8 }}>
           <span className="mono" style={{ fontSize: 11, color: "var(--sf-text)", fontWeight: 500, letterSpacing: "0.02em" }}>
             Architecture Configuration
           </span>
           <span className="sf-faint" style={{ fontSize: 11 }}>·</span>
           <span className="mono" style={{ fontSize: 10, color: "var(--sf-blue)", textTransform: "uppercase" }}>
             {currentStep.id}
           </span>
        </div>
        <span className="sf-grow" />
        <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)" }}>
          Step {currentIndex + 1} of {steps.length}
        </span>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "var(--sf-text)",
            marginBottom: 24,
            letterSpacing: "-0.015em",
            lineHeight: 1.3
          }}
        >
          {currentStep.title}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {currentStep.options.map((opt) => {
            const isSelected = selectedValue === opt.id && !isCustomMode;
            const brand = BRAND_ICONS[opt.id];
            const OptIcon = brand?.icon ?? opt.icon;
            const iconColor = brand?.color ?? "var(--sf-text)";

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="sf-col"
                style={{
                  padding: "16px",
                  background: isSelected ? "var(--sf-surface-2)" : "var(--sf-surface)",
                  border: "1px solid",
                  borderColor: isSelected ? "var(--sf-blue)" : "var(--sf-border)",
                  borderRadius: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all .15s ease",
                  position: "relative",
                  alignItems: "flex-start",
                  gap: 8
                }}
                type="button"
              >
                <div className="sf-row" style={{ gap: 10, width: "100%", alignItems: "center" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "var(--sf-bg)", border: "1px solid var(--sf-border)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <OptIcon size={16} style={{ color: iconColor }} />
                  </div>
                  <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--sf-text)" }}>{opt.name}</span>
                  <span className="sf-grow" />
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "1.5px solid",
                    borderColor: isSelected ? "var(--sf-blue)" : "var(--sf-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isSelected ? "var(--sf-blue)" : "transparent"
                  }}>
                    {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
                  {opt.description}
                </div>
              </button>
            );
          })}

          <button
            onClick={() => handleSelect("AUTO")}
            className="sf-col"
            style={{
              padding: "16px",
              background: selectedValue === "AUTO" && !isCustomMode ? "var(--sf-surface-2)" : "var(--sf-surface)",
              border: "1px solid",
              borderColor: selectedValue === "AUTO" && !isCustomMode ? "var(--sf-blue)" : "var(--sf-border)",
              borderRadius: 12,
              textAlign: "left",
              cursor: "pointer",
              transition: "all .15s ease",
              position: "relative",
              alignItems: "flex-start",
              gap: 8
            }}
            type="button"
          >
            <div className="sf-row" style={{ gap: 10, width: "100%", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--sf-bg)", border: "1px solid var(--sf-border)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Wand2 size={16} style={{ color: "var(--sf-text)" }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--sf-text)" }}>You Decide</span>
              <span className="sf-grow" />
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "1.5px solid",
                borderColor: selectedValue === "AUTO" && !isCustomMode ? "var(--sf-blue)" : "var(--sf-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: selectedValue === "AUTO" && !isCustomMode ? "var(--sf-blue)" : "transparent"
              }}>
                {selectedValue === "AUTO" && !isCustomMode && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
              Simplicit will choose the best option
            </div>
          </button>

          {currentStep.allowNotRequired && (
            <button
              onClick={() => handleSelect("NONE")}
              className="sf-col"
              style={{
                padding: "16px",
                background: selectedValue === "NONE" && !isCustomMode ? "var(--sf-surface-2)" : "var(--sf-surface)",
                border: "1px solid",
                borderColor: selectedValue === "NONE" && !isCustomMode ? "var(--sf-blue)" : "var(--sf-border)",
                borderRadius: 12,
                textAlign: "left",
                cursor: "pointer",
                transition: "all .15s ease",
                position: "relative",
                alignItems: "flex-start",
                gap: 8
              }}
              type="button"
            >
              <div className="sf-row" style={{ gap: 10, width: "100%", alignItems: "center" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--sf-bg)", border: "1px solid var(--sf-border)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <XCircle size={16} style={{ color: "var(--sf-text)" }} />
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--sf-text)" }}>Not Required</span>
                <span className="sf-grow" />
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "1.5px solid",
                  borderColor: selectedValue === "NONE" && !isCustomMode ? "var(--sf-blue)" : "var(--sf-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: selectedValue === "NONE" && !isCustomMode ? "var(--sf-blue)" : "transparent"
                }}>
                  {selectedValue === "NONE" && !isCustomMode && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
                Skip this infrastructure
              </div>
            </button>
          )}

          <button
            onClick={handleCustomSelect}
            className="sf-col"
            style={{
              padding: "16px",
              background: (isCustomMode || isCustomSelected) ? "var(--sf-surface-2)" : "var(--sf-surface)",
              border: "1px solid",
              borderColor: (isCustomMode || isCustomSelected) ? "var(--sf-blue)" : "var(--sf-border)",
              borderRadius: 12,
              textAlign: "left",
              cursor: "pointer",
              transition: "all .15s ease",
              position: "relative",
              alignItems: "flex-start",
              gap: 8
            }}
            type="button"
          >
            <div className="sf-row" style={{ gap: 10, width: "100%", alignItems: "center" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--sf-bg)", border: "1px solid var(--sf-border)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <MessageSquare size={16} style={{ color: "var(--sf-text)" }} />
              </div>
              <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--sf-text)" }}>Other</span>
              <span className="sf-grow" />
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "1.5px solid",
                borderColor: (isCustomMode || isCustomSelected) ? "var(--sf-blue)" : "var(--sf-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: (isCustomMode || isCustomSelected) ? "var(--sf-blue)" : "transparent"
              }}>
                {(isCustomMode || isCustomSelected) && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
              Specify a custom provider
            </div>
          </button>
        </div>

        {(isCustomMode || isCustomSelected) && (
          <div className="sf-col" style={{ 
            gap: 10, padding: '16px', marginTop: 12, 
            background: 'var(--sf-surface-2)', border: '1px solid var(--sf-blue)', 
            borderRadius: 12 
          }}>
            <div className="sf-row" style={{ gap: 8 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--sf-blue)', fontWeight: 600 }}>CUSTOM PROVIDER</span>
            </div>
            <input 
                autoFocus
                value={customText || (isCustomSelected ? selectedValue : "")}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={`e.g. CockroachDB`}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                  borderRadius: 8, color: 'var(--sf-text)', fontFamily: 'inherit',
                  fontSize: 14, outline: 'none'
                }}
            />
            <div className="sf-row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button onClick={() => {setIsCustomMode(false); if(isCustomSelected) setPreferences(prev => ({...prev, [currentStep.id]: undefined}))}} className="sf-btn sf-btn--ghost sf-btn--sm">Cancel</button>
                <button onClick={handleCustomSubmit} className="sf-btn sf-btn--primary sf-btn--sm" disabled={!customText.trim() && !isCustomSelected}>
                  Confirm selection
                </button>
            </div>
          </div>
        )}

        <div className="sf-row" style={{ marginTop: 32, gap: 10 }}>
            <button onClick={handleBack} className="sf-btn sf-btn--ghost" disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0 : 1 }} type="button">
              <ArrowLeft size={13} style={{ marginRight: 6 }} /> Back
            </button>
            <span className="sf-grow" />
            <button 
              onClick={handleNext} 
              className="sf-btn sf-btn--primary"
              disabled={!selectedValue}
              type="button"
            >
                Continue to next step <ArrowRight size={13} style={{ marginLeft: 6 }} />
            </button>
        </div>
      </div>

      <div
        style={{
          height: 4,
          background: "var(--sf-border)",
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress}%`,
            background: "var(--sf-blue)",
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}
