"use client";

import { useState, useMemo, useEffect } from "react";
import { HelpCircle, ChevronRight, Check, Info, ArrowRight, ArrowLeft, MessageSquare } from "lucide-react";
import type { ClarificationQuestion, ConfidenceLevel } from "../types";

interface ClarificationQuestionsProps {
  questions: ClarificationQuestion[];
  onComplete: (answers: Record<string, string | string[]>) => void;
}

export function ClarificationQuestions({
  questions,
  onComplete,
}: ClarificationQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Objective 5: Conditional Logic
  const visibleQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!q.dependsOn) return true;
      const parentAnswer = answers[q.dependsOn.questionId];
      if (!parentAnswer) return false;
      
      const requiredValues = Array.isArray(q.dependsOn.value) ? q.dependsOn.value : [q.dependsOn.value];
      if (Array.isArray(parentAnswer)) {
        return parentAnswer.some(val => requiredValues.includes(val));
      }
      return requiredValues.includes(parentAnswer);
    });
  }, [questions, answers]);

  const currentQuestion = visibleQuestions[currentIndex];

  useEffect(() => {
    setCustomText("");
    setIsCustomMode(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < visibleQuestions.length - 1) {
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

  const handleSelect = (value: string, isCustom?: boolean) => {
    if (isCustom) {
      setIsCustomMode(true);
      return;
    }

    if (currentQuestion.type === "single-choice") {
      const newAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(newAnswers);
      // Auto-advance for single choice
      if (currentIndex < visibleQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete(newAnswers);
      }
    } else {
      // Multi-choice
      setAnswers(prev => {
        const current = (prev[currentQuestion.id] as string[]) || [];
        const next = current.includes(value) 
          ? current.filter(v => v !== value) 
          : [...current, value];
        return { ...prev, [currentQuestion.id]: next };
      });
    }
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    const value = `custom: ${customText.trim()}`;
    
    if (currentQuestion.type === "single-choice") {
      const newAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(newAnswers);
      handleNext();
    } else {
       setAnswers(prev => {
        const current = (prev[currentQuestion.id] as string[]) || [];
        return { ...prev, [currentQuestion.id]: [...current, value] };
      });
      setIsCustomMode(false);
      setCustomText("");
    }
  };

  const handleFreeTextSubmit = () => {
    if (!customText.trim()) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: customText.trim() }));
    handleNext();
  };

  if (!currentQuestion) return null;

  const progress = Math.round(((currentIndex + 1) / visibleQuestions.length) * 100);

  const renderConfidenceBadge = (conf: ConfidenceLevel) => {
    const map: Record<string, { label: string, color: string }> = {
      "Heuristic inference": { label: "REQUIRED", color: "var(--sf-blue)" },
      "Partial evidence": { label: "DISCOVERY", color: "oklch(0.72 0.16 250)" },
      "Strong evidence": { label: "CONFIRM", color: "oklch(0.78 0.16 145)" },
    };
    const style = map[conf] || { label: "ARCHITECTURAL", color: "var(--sf-text-faint)" };
    return (
      <span className="mono" style={{ 
        fontSize: 8.5, padding: "1px 5px", borderRadius: 4, 
        background: `${style.color}20`, color: style.color,
        border: `1px solid ${style.color}40`, fontWeight: 700
      }}>{style.label}</span>
    );
  };

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
      {/* Header */}
      <div
        className="sf-row"
        style={{
          padding: "12px 16px",
          gap: 10,
          background: "var(--sf-bg-2)",
          borderBottom: "1px solid var(--sf-border)",
        }}
      >
        <HelpCircle size={14} style={{ color: "var(--sf-blue)" }} />
        <div className="sf-row" style={{ gap: 8 }}>
           <span className="mono" style={{ fontSize: 11, color: "var(--sf-text)", fontWeight: 500, letterSpacing: "0.02em" }}>
             Architectural Discovery
           </span>
           <span className="sf-faint" style={{ fontSize: 11 }}>·</span>
           <span className="mono" style={{ fontSize: 10, color: "var(--sf-blue)", textTransform: "uppercase" }}>{currentQuestion.category}</span>
        </div>
        <span className="sf-grow" />
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--sf-text-faint)" }}
        >
          {currentIndex + 1} of {visibleQuestions.length} ({progress}%)
        </span>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Intelligence Signal */}
        <div
          className="sf-row"
          style={{
            gap: 10,
            marginBottom: 18,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 8,
            border: "1px solid var(--sf-border)",
          }}
        >
          <Info size={13} style={{ color: "var(--sf-blue)", flex: "0 0 auto" }} />
          <div className="sf-col" style={{ gap: 4 }}>
             <div className="sf-row" style={{ gap: 8 }}>
                <span className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)" }}>ARCHITECTURAL SIGNAL</span>
                {renderConfidenceBadge(currentQuestion.confidence)}
             </div>
             <span style={{ fontSize: 12.5, color: "var(--sf-text-muted)", lineHeight: 1.4, fontStyle: 'italic' }}>
               {currentQuestion.reason}
             </span>
          </div>
        </div>

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
          {currentQuestion.text}
        </h3>

        {/* Question Inputs */}
        <div className="sf-col" style={{ gap: 8 }}>
          {currentQuestion.type === "free-text" ? (
            <div className="sf-col" style={{ gap: 12 }}>
               <textarea 
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Describe your requirements..."
                  style={{
                    width: '100%', minHeight: 120, padding: '14px',
                    background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
                    borderRadius: 12, color: 'var(--sf-text)', fontFamily: 'inherit',
                    fontSize: 14.5, outline: 'none', resize: 'none', lineHeight: 1.5
                  }}
               />
               <div className="sf-row" style={{ justifyContent: 'flex-end' }}>
                 <button onClick={handleFreeTextSubmit} className="sf-btn sf-btn--primary sf-btn--sm">
                    Confirm requirement <ArrowRight size={12} style={{ marginLeft: 6 }} />
                 </button>
               </div>
            </div>
          ) : (
            <>
              {currentQuestion.options?.map((opt) => {
                const isSelected = currentQuestion.type === "single-choice" 
                  ? answers[currentQuestion.id] === opt.value
                  : (answers[currentQuestion.id] as string[] || []).includes(opt.value);

                return (
                  <div key={opt.value} className="sf-col" style={{ gap: 8 }}>
                    <button
                      onClick={() => handleSelect(opt.value, opt.isCustom)}
                      className="sf-row"
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        gap: 14,
                        background: isSelected || (opt.isCustom && isCustomMode) ? "var(--sf-surface-2)" : "var(--sf-surface)",
                        border: "1px solid",
                        borderColor: isSelected || (opt.isCustom && isCustomMode) ? "var(--sf-blue)" : "var(--sf-border)",
                        borderRadius: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all .15s ease",
                      }}
                      type="button"
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: currentQuestion.type === "single-choice" ? "50%" : "4px",
                          border: "1.5px solid",
                          borderColor: isSelected || (opt.isCustom && isCustomMode) ? "var(--sf-blue)" : "var(--sf-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                          background: isSelected || (opt.isCustom && isCustomMode) ? "var(--sf-blue)" : "transparent",
                        }}
                      >
                        {(isSelected || (opt.isCustom && isCustomMode)) && <Check size={12} color="#fff" strokeWidth={3} />}
                      </div>
                      <div className="sf-grow">
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 500,
                            color: isSelected || (opt.isCustom && isCustomMode) ? "var(--sf-text)" : "var(--sf-text-muted)",
                          }}
                        >
                          {opt.label}
                        </div>
                        {opt.description && (
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "var(--sf-text-faint)",
                              marginTop: 3,
                              lineHeight: 1.4
                            }}
                          >
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Custom Input Revelation (Objective 3) */}
                    {opt.isCustom && isCustomMode && (
                       <div className="sf-col" style={{ 
                         gap: 10, padding: '16px', marginTop: -4, 
                         background: 'var(--sf-surface-2)', border: '1px solid var(--sf-blue)', 
                         borderRadius: 12, borderTopLeftRadius: 0, borderTopRightRadius: 0 
                       }}>
                          <div className="sf-row" style={{ gap: 8 }}>
                             <MessageSquare size={12} style={{ color: 'var(--sf-blue)' }} />
                             <span className="mono" style={{ fontSize: 9, color: 'var(--sf-blue)', fontWeight: 600 }}>SPECIFY CUSTOM REQUIREMENT</span>
                          </div>
                          <textarea 
                             autoFocus
                             value={customText}
                             onChange={(e) => setCustomText(e.target.value)}
                             placeholder="e.g. Must support multi-factor auth via hardware keys..."
                             style={{
                               width: '100%', minHeight: 80, padding: '10px',
                               background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                               borderRadius: 8, color: 'var(--sf-text)', fontFamily: 'inherit',
                               fontSize: 13.5, outline: 'none', resize: 'none'
                             }}
                          />
                          <div className="sf-row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                             <button onClick={() => setIsCustomMode(false)} className="sf-btn sf-btn--ghost sf-btn--sm">Cancel</button>
                             <button onClick={handleCustomSubmit} className="sf-btn sf-btn--primary sf-btn--sm" disabled={!customText.trim()}>
                                Add custom requirement
                             </button>
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {(currentQuestion.type === "multi-choice" || currentIndex > 0) && (
          <div className="sf-row" style={{ marginTop: 32, gap: 10 }}>
             {currentIndex > 0 && (
               <button onClick={handleBack} className="sf-btn sf-btn--ghost" type="button">
                 <ArrowLeft size={13} style={{ marginRight: 6 }} /> Back
               </button>
             )}
             <span className="sf-grow" />
             {currentQuestion.type === "multi-choice" && (
                <button 
                  onClick={handleNext} 
                  className="sf-btn sf-btn--primary"
                  disabled={(answers[currentQuestion.id] as string[] || []).length === 0}
                  type="button"
                >
                   Continue to next step <ArrowRight size={13} style={{ marginLeft: 6 }} />
                </button>
             )}
          </div>
        )}
      </div>

      {/* Progress Footer */}
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
