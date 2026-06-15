'use client';

import { useState, useEffect, useRef } from 'react';
import type { PipelineEvent } from '../types/pipeline-events';

interface DeployButtonProps {
  projectName: string;
  // The generated files are persisted server-side (projects.generation_metadata)
  // by the pipeline — the deploy route loads them by projectId, so the client
  // never round-trips the file map.
  projectId: string;
  onDeployEvent: (event: PipelineEvent) => void; // updates the DEPLOY stage in PipelineStatusPanel
}

export function DeployButton({ projectName, projectId, onDeployEvent }: DeployButtonProps) {
  const [hasRailwayToken, setHasRailwayToken] = useState<boolean | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check if a Railway token is configured (boolean only — no token data)
  useEffect(() => {
    fetch('/api/deploy/settings')
      .then((r) => r.json())
      .then((data) => setHasRailwayToken(data.railway ?? false))
      .catch(() => setHasRailwayToken(false));
  }, []);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setInlineError(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/deploy/railway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let msg = `Deploy failed to start (HTTP ${response.status})`;
        try {
          const jsonErr = await response.json();
          if (jsonErr?.error) msg = jsonErr.error;
        } catch { /* body wasn't JSON */ }
        throw new Error(msg);
      }
      if (!response.body) throw new Error('No response stream received');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: PipelineEvent = JSON.parse(line.slice(6));
            onDeployEvent(event);
            if (event.deployUrl) setDeployUrl(event.deployUrl);
            if (event.status === 'error') setInlineError(event.message);
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const message = err instanceof Error ? err.message : String(err);
        setInlineError(message);
        onDeployEvent({
          type: 'stage_update',
          stage: 'DEPLOY',
          status: 'error',
          message,
          userError: {
            title: 'Deployment failed',
            explanation: message,
            action: 'Check your Railway and GitHub configuration, then try again.',
            recoverable: true,
            stage: 'DEPLOY',
          },
          timestamp: Date.now(),
        });
      }
    } finally {
      setIsDeploying(false);
    }
  };

  if (hasRailwayToken === null) return null; // still loading

  if (!hasRailwayToken) {
    return (
      <div className="deploy-no-token">
        <span>Add a Railway token in Settings to deploy</span>
        <a href="/settings" className="deploy-settings-link">Configure →</a>
      </div>
    );
  }

  if (deployUrl) {
    return (
      <div className="deploy-success">
        <span>✓ Backend live</span>
        <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="deploy-url-link">
          {deployUrl} ↗
        </a>
      </div>
    );
  }

  return (
    <>
      <button className="deploy-btn" onClick={handleDeploy} disabled={isDeploying} type="button">
        {isDeploying ? (
          <><span className="deploy-btn-spinner" /> Deploying to Railway...</>
        ) : (
          '🚀 Deploy to Railway'
        )}
      </button>
      {inlineError && <div className="deploy-inline-error">{inlineError}</div>}
    </>
  );
}
