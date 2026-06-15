'use client';

import { useState } from 'react';
import type { StageState, PipelineStreamState } from '../hooks/usePipelineStream';
import type { PipelineStage, UserFacingError } from '../types/pipeline-events';
import './PipelineStatusPanel.css';

interface PipelineStatusPanelProps {
  state: PipelineStreamState;
  onCancel: () => void;
  onRetry: () => void;
  stageLabels: Record<PipelineStage, string>;
  // Optional footer slot (e.g. the DeployButton) rendered after the summary.
  children?: React.ReactNode;
}

/**
 * Pure presentational pipeline status — all data flows in via props from
 * usePipelineStream. Renders one card per agent on a vertical progress rail.
 */
export function PipelineStatusPanel({ state, onCancel, onRetry, stageLabels, children }: PipelineStatusPanelProps) {
  const { isRunning, isComplete, stages, globalError, summary, elapsedSeconds, deployUrl } = state;

  return (
    <div className="pipeline-panel">
      {/* Header */}
      <div className="pipeline-header">
        <span className="pipeline-title">
          {isRunning && 'Generating backend...'}
          {isComplete && !globalError && '✓ Backend ready'}
          {globalError && '⚠️ Generation failed'}
          {!isRunning && !isComplete && !globalError && 'Ready to generate'}
        </span>
        {isRunning && <span className="pipeline-elapsed">{elapsedSeconds}s</span>}
        {isRunning && (
          <button className="pipeline-cancel-btn" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
      </div>

      {/* Agent cards with connector rail */}
      <div className="pipeline-stages">
        {stages.map((stage, index) => (
          <StageCard
            key={stage.stage}
            stage={stage}
            label={stageLabels[stage.stage]}
            isLast={index === stages.length - 1}
          />
        ))}
      </div>

      {/* Global error panel */}
      {globalError && <ErrorPanel error={globalError} onRetry={onRetry} />}

      {/* Summary panel — shown after successful completion */}
      {isComplete && summary && !globalError && <SummaryPanel summary={summary} deployUrl={deployUrl} />}

      {/* Footer slot (deploy controls) */}
      {children}
    </div>
  );
}

// ── StageCard ──────────────────────────────────────────────────────────────

function StageCard({ stage, label, isLast }: { stage: StageState; label: string; isLast: boolean }) {
  const [errorExpanded, setErrorExpanded] = useState(false);

  const statusIcon = {
    pending: <span className="status-dot status-dot--pending" />,
    running: <span className="status-spinner" aria-label="Running" />,
    done: <span className="status-icon status-icon--done" aria-label="Done">✓</span>,
    error: <span className="status-icon status-icon--error" aria-label="Warning: error occurred">⚠️</span>,
    skipped: <span className="status-dot status-dot--skipped" />,
  }[stage.status];

  const connectorFilled = stage.status === 'done';

  return (
    <div className={`stage-card stage-card--${stage.status}`}>
      {/* Left rail + icon */}
      <div className="stage-rail">
        <div className="stage-icon-wrapper">{statusIcon}</div>
        {!isLast && (
          <div className={`stage-connector ${connectorFilled ? 'stage-connector--filled' : ''}`} />
        )}
      </div>

      {/* Content */}
      <div className="stage-content">
        <div className="stage-name">{label}</div>
        {stage.message && <div className="stage-message">{stage.message}</div>}

        {/* Error expansion */}
        {stage.status === 'error' && stage.userError && (
          <div className="stage-error">
            <button
              className="stage-error-toggle"
              onClick={() => setErrorExpanded((e) => !e)}
              type="button"
            >
              {errorExpanded ? '▲ Hide detail' : '▼ What went wrong?'}
            </button>
            {errorExpanded && (
              <div className="stage-error-detail">
                <p className="error-explanation">{stage.userError.explanation}</p>
                <p className="error-action">
                  <strong>What to do:</strong> {stage.userError.action}
                </p>
                {stage.userError.technicalDetail && (
                  <details className="error-technical">
                    <summary>Technical detail</summary>
                    <code>{stage.userError.technicalDetail}</code>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ErrorPanel (global failure) ────────────────────────────────────────────

function ErrorPanel({ error, onRetry }: { error: UserFacingError; onRetry: () => void }) {
  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <span className="error-panel-title">{error.title}</span>
      </div>
      <p className="error-panel-explanation">{error.explanation}</p>
      <p className="error-panel-action">{error.action}</p>
      {error.recoverable && (
        <button className="error-retry-btn" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}

// ── SummaryPanel ───────────────────────────────────────────────────────────

function SummaryPanel({
  summary,
  deployUrl,
}: {
  summary: NonNullable<PipelineStreamState['summary']>;
  deployUrl: string | null;
}) {
  return (
    <div className="summary-panel">
      <div className="summary-row">
        <span>{summary.modulesGenerated} module{summary.modulesGenerated !== 1 ? 's' : ''}</span>
        <span>{summary.testFilesGenerated} test file{summary.testFilesGenerated !== 1 ? 's' : ''}</span>
        {summary.securityIssuesFound > 0 && (
          <span>{summary.securityIssuesFixed}/{summary.securityIssuesFound} security fixes</span>
        )}
        {summary.sdkFilesGenerated && <span>API client ready</span>}
      </div>
      <div className="summary-duration">
        Completed in {(summary.durationMs / 1000).toFixed(1)}s
      </div>
      {deployUrl && (
        <div className="summary-deploy-url">
          <a href={deployUrl} target="_blank" rel="noopener noreferrer">
            Open backend ↗ {deployUrl}
          </a>
        </div>
      )}
    </div>
  );
}
