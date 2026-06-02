import { DomainGraph, BusinessCapability, DomainEntity } from "../domain-intelligence-types";

export interface ArchitectureRequirements {
  database: boolean;
  authentication: boolean;
  storage: boolean;
  email: boolean;
  payments: boolean;
  queue: boolean;
  deployment: boolean;
}

export function detectArchitectureRequirements(graph: DomainGraph): ArchitectureRequirements {
  const database = graph.entities && graph.entities.length > 0;

  const hasUserEntity = graph.entities?.some(e => e.name.toLowerCase().includes('user') || e.name.toLowerCase().includes('account'));
  const hasAuthCapabilities = graph.capabilities?.some(c => 
    c.name.toLowerCase().includes('auth') || 
    c.name.toLowerCase().includes('login') || 
    c.name.toLowerCase().includes('register')
  ) || false;
  const authentication = hasUserEntity || hasAuthCapabilities;

  const hasStorageFields = graph.entities?.some(e => 
    e.fields?.some(f => f.name.toLowerCase().includes('url') || f.name.toLowerCase().includes('file') || f.name.toLowerCase().includes('image') || f.name.toLowerCase().includes('avatar') || f.name.toLowerCase().includes('media'))
  ) || false;
  const storage = hasStorageFields;

  const hasPaymentCapabilities = graph.capabilities?.some(c => 
    c.name.toLowerCase().includes('payment') || 
    c.name.toLowerCase().includes('bill') || 
    c.name.toLowerCase().includes('subscription') || 
    c.name.toLowerCase().includes('checkout')
  ) || false;
  const payments = hasPaymentCapabilities || graph.entities?.some(e => e.name.toLowerCase().includes('subscription') || e.name.toLowerCase().includes('payment') || e.name.toLowerCase().includes('invoice')) || false;

  const hasEmailCapabilities = graph.capabilities?.some(c => 
    c.name.toLowerCase().includes('email') || 
    c.name.toLowerCase().includes('invite') || 
    c.name.toLowerCase().includes('verify') || 
    c.name.toLowerCase().includes('reset')
  ) || false;
  const email = hasEmailCapabilities;

  const hasQueueCapabilities = graph.capabilities?.some(c => 
    c.name.toLowerCase().includes('job') || 
    c.name.toLowerCase().includes('queue') || 
    c.name.toLowerCase().includes('background') || 
    c.name.toLowerCase().includes('notification') ||
    c.name.toLowerCase().includes('async')
  ) || false;
  const queue = hasQueueCapabilities;

  return {
    database,
    authentication,
    storage,
    email,
    payments,
    queue,
    deployment: true // Always true
  };
}
