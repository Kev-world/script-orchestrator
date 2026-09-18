import React from 'react';
import { Persona } from '../types';
import { ShieldCheck, Users, Terminal, BookOpen, GitPullRequest, Layers } from 'lucide-react';

interface HeaderProps {
  currentPersona: Persona;
  onSelectPersona: (p: Persona) => void;
  activeTab: 'triage' | 'runbooks' | 'prs' | 'adr_spec';
  onSelectTab: (t: 'triage' | 'runbooks' | 'prs' | 'adr_spec') => void;
  prCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPersona,
  onSelectPersona,
  activeTab,
  onSelectTab,
  prCount,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-bold font-mono text-base shadow-sm">
              42
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-stone-900 text-base tracking-tight">
                  ADR-042: Runbook AI
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Accepted
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Self-Evolving Log Investigation &amp; Bilingual Dual-Layer Synthesis
              </p>
            </div>
          </div>

          {/* Navigation & Persona switch */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* View Tabs */}
            <nav className="flex items-center bg-stone-100 p-1 rounded-lg text-xs font-medium text-stone-600">
              <button
                id="tab-triage"
                onClick={() => onSelectTab('triage')}
                className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'triage'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-stone-500" />
                <span>Live Triage</span>
              </button>

              <button
                id="tab-runbooks"
                onClick={() => onSelectTab('runbooks')}
                className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'runbooks'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>Runbooks</span>
              </button>

              <button
                id="tab-prs"
                onClick={() => onSelectTab('prs')}
                className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors relative ${
                  activeTab === 'prs'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 text-stone-500" />
                <span>PR Queue</span>
                {prCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                    {prCount}
                  </span>
                )}
              </button>

              <button
                id="tab-adr"
                onClick={() => onSelectTab('adr_spec')}
                className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'adr_spec'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>ADR Spec</span>
              </button>
            </nav>

            {/* Persona Switcher */}
            <div className="flex items-center pl-2 border-l border-stone-200">
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  id="persona-cs"
                  title="Customer Success / Non-technical View (Restricted to Certified Runbooks)"
                  onClick={() => onSelectPersona('customer_success')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                    currentPersona === 'customer_success'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">CS / Sales</span>
                </button>
                <button
                  id="persona-sre"
                  title="SRE / Technical View (Access to Python scripts, sandbox dry-run, PR merges)"
                  onClick={() => onSelectPersona('sre_engineer')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                    currentPersona === 'sre_engineer'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">SRE / Eng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
