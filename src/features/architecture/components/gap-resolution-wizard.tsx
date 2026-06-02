"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ArrowRight, ArrowLeft, AlertTriangle, Info, Check, MessageSquare } from "lucide-react";
import { GapQuestion, GapResolutionAnswer } from "../engines/gap-resolution-engine";

interface GapResolutionWizardProps {
  questions: GapQuestion[];
  onComplete: (answers: GapResolutionAnswer[]) => void;
}

export function GapResolutionWizard({ questions, onComplete }: GapResolutionWizardProps) {
  const [answers, setAnswers] = useState<GapResolutionAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setCustomText("");
    setIsCustomMode(false);
  }, [currentIndex]);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSelect = (value: string) => {
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...existing, { questionId: currentQuestion.id, value }];
    });
    // Auto-advance
    setTimeout(() => {
      handleNext();
    }, 200);
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    setAnswers(prev => {
      const existing = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...existing, { questionId: currentQuestion.id, value: `custom: ${customText.trim()}` }];
    });
    setIsCustomMode(false);
    setCustomText("");
    handleNext();
  };

  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.value;
  const isCustomSelected = currentAnswer?.startsWith('custom: ');
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="sf-card-elev" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
      <div className="sf-row" style={{ padding: "12px 16px", gap: 10, background: "var(--sf-bg-2)", borderBottom: "1px solid var(--sf-border)" }}>
        <AlertTriangle size={14} style={{ color: "var(--sf-amber)" }} />
        <span className="mono" style={{ fontSize: 11, color: "var(--sf-text)", fontWeight: 500 }}>
          Domain Ambiguity Resolution
        </span>
        <span className="sf-grow" />
        <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)" }}>
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, color: "var(--sf-text)", marginBottom: 16, lineHeight: 1.3 }}>
          {currentQuestion.question}
        </h3>

        <div className="sf-card" style={{ padding: "12px 16px", background: "rgba(46,160,255,0.05)", border: "1px solid rgba(46,160,255,0.2)", marginBottom: 24, display: "flex", gap: 10 }}>
          <Info size={16} style={{ color: "var(--sf-blue)", flexShrink: 0, marginTop: 2 }} />
          <div className="sf-col" style={{ gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-blue)" }}>Why are we asking this?</span>
            <span style={{ fontSize: 13, color: "var(--sf-text-muted)", lineHeight: 1.5 }}>{currentQuestion.reason}</span>
          </div>
        </div>

        <div className="sf-col" style={{ gap: 8 }}>
          {currentQuestion.options.map(opt => {
            const isSelected = currentAnswer === opt.value && !isCustomMode;
            if (opt.isCustom) return null; // Handle custom separately
            return (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="sf-row"
                style={{
                  padding: "14px 16px",
                  background: isSelected ? "var(--sf-surface-2)" : "var(--sf-surface)",
                  border: "1px solid",
                  borderColor: isSelected ? "var(--sf-blue)" : "var(--sf-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                type="button"
              >
                <span style={{ fontSize: 14, color: "var(--sf-text)" }}>{opt.label}</span>
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
              </button>
            );
          })}

          {currentQuestion.options.some(o => o.isCustom) && (
            <button
              onClick={() => setIsCustomMode(true)}
              className="sf-row"
              style={{
                padding: "14px 16px",
                background: (isCustomMode || isCustomSelected) ? "var(--sf-surface-2)" : "var(--sf-surface)",
                border: "1px solid",
                borderColor: (isCustomMode || isCustomSelected) ? "var(--sf-blue)" : "var(--sf-border)",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              type="button"
            >
              <MessageSquare size={14} style={{ marginRight: 10, color: "var(--sf-text-muted)" }} />
              <span style={{ fontSize: 14, color: "var(--sf-text)" }}>Custom approach</span>
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
            </button>
          )}
        </div>

        {(isCustomMode || isCustomSelected) && (
          <div className="sf-col" style={{ gap: 10, padding: '16px', marginTop: 12, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-blue)', borderRadius: 8 }}>
            <input 
              autoFocus
              value={customText || (isCustomSelected ? currentAnswer?.replace('custom: ', '') : "")}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Describe your requirement..."
              style={{
                width: '100%', padding: '12px 14px', background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                borderRadius: 6, color: 'var(--sf-text)', fontFamily: 'inherit', fontSize: 14, outline: 'none'
              }}
            />
            <div className="sf-row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button onClick={() => { setIsCustomMode(false); if(isCustomSelected) handleSelect(""); }} className="sf-btn sf-btn--ghost sf-btn--sm">Cancel</button>
              <button onClick={handleCustomSubmit} className="sf-btn sf-btn--primary sf-btn--sm" disabled={!customText.trim() && !isCustomSelected}>
                Confirm
              </button>
            </div>
          </div>
        )}

        <div className="sf-row" style={{ marginTop: 32, gap: 10 }}>
          <button onClick={handleBack} className="sf-btn sf-btn--ghost" disabled={currentIndex === 0} style={{ opacity: currentIndex === 0 ? 0.5 : 1 }} type="button">
            <ArrowLeft size={13} style={{ marginRight: 6 }} /> Back
          </button>
          <span className="sf-grow" />
          <button onClick={handleNext} className="sf-btn sf-btn--primary" disabled={!currentAnswer && !isCustomMode} type="button">
            {currentIndex < questions.length - 1 ? "Next question" : "Complete resolution"} <ArrowRight size={13} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </div>

      <div style={{ height: 4, background: "var(--sf-border)", width: "100%", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "var(--sf-blue)", transition: "width .4s ease" }} />
      </div>
    </div>
  );
}
