import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Shield, Brain, Wrench, Book, ShieldAlert,
  ExternalLink, AlertTriangle, ArrowRight, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OSMockup } from '../features/resources/OSMockup';
import {
  osGuides,
  toolCategories,
  priorityConfig,
  aiNeverShare,
  aiThreats,
  aiPrivacyTools,
  aiProtectionTools,
  sourceProtectionChapters,
} from '../features/resources/resources.data';
import {
  NewsBadge,
  NewsCard,
  NewsNotice,
  NewsPage,
  NewsSectionHeader,
  NewsTabs,
} from '../components/editorial/NewsPage';

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const ToolLedgerRow = ({ tool, index, color }) => {
  const p = priorityConfig[tool.priority] ?? priorityConfig['recommended'];
  return (
    <div className="news-ledger-row notebook-ledger-row">
      <span className="news-row-index" style={{ '--row-accent': color }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="news-card-title">{tool.name}</h3>
            <p className="news-card-copy mt-1">{tool.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tool.platforms.map((pl, i) => (
                <span key={i} className="news-chip">{pl}</span>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5 shrink-0 pt-0.5">
            <NewsBadge color={p.color} className="notebook-stamp whitespace-nowrap">{p.label}</NewsBadge>
            {tool.url && (
              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                className="text-smoke hover:text-oxblood transition-colors mt-0.5"
                aria-label={`Open ${tool.name}`}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GenericLedgerRow = ({ tool, index, color, badgeLabel, badgeColor }) => (
  <div className="news-ledger-row notebook-ledger-row">
    <span className="news-row-index" style={{ '--row-accent': color }}>
      {String(index + 1).padStart(2, '0')}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="news-card-title">{tool.name}</h3>
          <p className="news-card-copy mt-1">{tool.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tool.platforms.map((pl, i) => (
              <span key={i} className="news-chip">{pl}</span>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-2.5 shrink-0 pt-0.5">
          <NewsBadge color={badgeColor || color} className="notebook-stamp whitespace-nowrap">
            {badgeLabel || tool.badge}
          </NewsBadge>
          {tool.url && (
            <a href={tool.url} target="_blank" rel="noopener noreferrer"
              className="text-smoke hover:text-oxblood transition-colors mt-0.5"
              aria-label={`Open ${tool.name}`}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

const WarningCard = ({ item }) => {
  const ItemIcon = item.icon;
  const accent = item.severity === 'critical' ? '#7B2E2E' : '#8A6D2C';
  return (
    <NewsCard className="notebook-card flex gap-3 items-start" accent={accent}>
      <ItemIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: accent }} />
      <div>
        <h3 className="news-card-title">{item.title}</h3>
        <p className="news-card-copy mt-1">{item.description}</p>
      </div>
    </NewsCard>
  );
};

/* ─── Page ───────────────────────────────────────────────────────────────── */

const Resources = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab]   = useState(() => searchParams.get('tab') || 'os-guides');
  const [selectedOS, setSelectedOS] = useState(() => searchParams.get('os') || 'windows');
  const [activeSourceChapter, setActiveSourceChapter] = useState(() => searchParams.get('chapter') || 'compartmentalization');

  const targetSection = searchParams.get('section');

  useEffect(() => {
    if (!targetSection || activeTab !== 'tools') return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`section-${targetSection}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
    return () => clearTimeout(timer);
  }, [targetSection, activeTab]);

  const tabs = [
    { id: 'os-guides',   label: 'OS Guides', desc: 'platform hardening',              icon: Monitor, accent: '#7B2E2E' },
    { id: 'tools',       label: 'Tools',     desc: 'vetted field kit',                icon: Wrench,  accent: '#8A6D2C' },
    { id: 'source-protection', label: 'Sources', desc: 'contact, meetings, publication', icon: Shield, accent: '#375E5A' },
    { id: 'ai-security', label: 'AI Safety', desc: 'threats and safer practice',      icon: Brain,   accent: '#15110C' },
  ];

  const currentOS = osGuides.find(o => o.id === selectedOS);
  const currentSourceChapter = sourceProtectionChapters.find((chapter) => chapter.id === activeSourceChapter) || sourceProtectionChapters[0];

  const [expandedStep, setExpandedStep] = useState(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setExpandedStep(null), [selectedOS]);

  return (
    <NewsPage className="resource-notebook">
      <div>
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="notebook-cover"
        >
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-5 h-5 text-smoke" />
            <span className="eyebrow sm text-smoke">Field desk</span>
          </div>
          <h1 className="display text-4xl md:text-6xl leading-none">
            Field Manual<em className="italic-ox">.</em>
          </h1>
          <p className="mt-4 text-base md:text-lg text-ink-soft leading-relaxed max-w-[52ch]">
            Security guides, source-handling protocols, and field-ready tools for journalists. Start with operating-system hardening, then move into communications, storage, source contact, and AI-risk habits.
          </p>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <NewsTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} className="notebook-index" />
        </Motion.div>

        <AnimatePresence mode="wait">

          {/* ── OS guides ──────────────────────────────────────────── */}
          {activeTab === 'os-guides' && (
            <Motion.div
              key="os-guides"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsSectionHeader
                className="notebook-section"
                kicker={`${currentOS.steps.length} steps`}
                title={currentOS.name}
                lede={currentOS.description}
                icon={currentOS.icon}
                accent={currentOS.color}
              />

              <div className="news-selector">
                {osGuides.map((os) => {
                  const Icon = os.icon;
                  return (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => setSelectedOS(os.id)}
                      className={`news-selector-button ${selectedOS === os.id ? 'is-active' : ''}`}
                      style={{ '--selector-accent': os.color }}
                    >
                      <Icon className="w-4 h-4" />
                      {os.name}
                    </button>
                  );
                })}
              </div>

              <div className="news-ledger notebook-ledger">
                {(() => { const StepIcon = currentOS.icon; return currentOS.steps.map((step, i) => {
                  const isExpanded = expandedStep === i;
                  return (
                    <div key={step.title}>
                      <button
                        type="button"
                        onClick={() => setExpandedStep(isExpanded ? null : i)}
                        aria-expanded={isExpanded}
                        className="news-ledger-row resource-step-row w-full text-left transition-colors hover:bg-paper-dim/40 group"
                        style={{ '--accent': currentOS.color }}
                      >
                        <span className="news-row-index" style={{ '--row-accent': currentOS.color }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <h3 className="news-card-title">{step.title}</h3>
                            <p className="news-card-copy mt-1">{step.details}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mt-0.5">
                            <Motion.div
                              animate={isExpanded ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <StepIcon
                                className="resource-step-icon w-4 h-4 transition-colors text-smoke-dim"
                                style={isExpanded ? { color: currentOS.color } : {}}
                              />
                            </Motion.div>
                            <ChevronDown
                              className="w-3.5 h-3.5 text-smoke transition-transform"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                          </div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <Motion.div
                            key="mockup"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="border-t border-ink/8 bg-paper-soft/50 flex justify-center py-8">
                              <OSMockup osId={currentOS.id} step={step} />
                            </div>
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }); })()}
              </div>
            </Motion.div>
          )}

          {/* ── Tools ──────────────────────────────────────────────── */}
          {activeTab === 'tools' && (
            <Motion.div
              key="tools"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {toolCategories.map((category, catIdx) => {
                const CatIcon = category.icon;
                return (
                  <section key={category.id} id={`section-${category.id}`} className={catIdx > 0 ? 'mt-12' : ''}>
                    <NewsSectionHeader
                      className="notebook-section"
                      kicker={`§ ${String(catIdx + 1).padStart(2, '0')} · ${category.tools.length} tools`}
                      title={category.name}
                      lede={category.description}
                      icon={CatIcon}
                      accent={category.color}
                    />
                    <div className="news-ledger notebook-ledger">
                      {category.tools.map((tool, i) => (
                        <ToolLedgerRow key={tool.name} tool={tool} index={i} color={category.color} />
                      ))}
                    </div>
                  </section>
                );
              })}

              <p className="border-t border-ink/15 pt-4 mt-12 text-xs leading-relaxed text-smoke">
                Always verify downloads from official sources. Keep software updated. Enable 2FA everywhere.
              </p>
            </Motion.div>
          )}

          {/* ── Source protection ─────────────────────────────────── */}
          {activeTab === 'source-protection' && (
            <Motion.div
              key="source-protection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsNotice tone="info" icon={ShieldAlert} className="notebook-warning">
                <h2 className="news-card-title">Pocket manual for source-facing work</h2>
                <p className="news-card-copy mt-1">
                  This section belongs in the reference desk: it is the slower, consultative layer for first contact, safer meetings, publication windows, and legal posture. For rehearsal under pressure, move into the Simulation Desk.
                </p>
              </NewsNotice>

              <NewsSectionHeader
                className="notebook-section"
                kicker={`§ ${String(sourceProtectionChapters.findIndex((chapter) => chapter.id === currentSourceChapter.id) + 1).padStart(2, '0')} · Pocket manual`}
                title={currentSourceChapter.label}
                lede={currentSourceChapter.brief}
                icon={currentSourceChapter.icon}
                accent={currentSourceChapter.color}
              />

              <div className="news-selector">
                {sourceProtectionChapters.map((chapter) => {
                  const Icon = chapter.icon;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setActiveSourceChapter(chapter.id)}
                      className={`news-selector-button ${activeSourceChapter === chapter.id ? 'is-active' : ''}`}
                      style={{ '--selector-accent': chapter.color }}
                    >
                      <Icon className="w-4 h-4" />
                      {chapter.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4 mt-4">
                {currentSourceChapter.cards.map((card) => (
                  <NewsCard key={card.title} accent={currentSourceChapter.color}>
                    <h3 className="news-card-title">{card.title}</h3>
                    <p className="news-card-copy mt-3 whitespace-pre-wrap">{card.body}</p>
                  </NewsCard>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 mt-8">
                <NewsCard accent="#7B2E2E">
                  <h3 className="news-card-title">Practice the judgment layer</h3>
                  <p className="news-card-copy mt-3">
                    Once the manual feels familiar, use the simulations to test phishing response, safer source contact, and border-search choices with immediate consequence feedback.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/simulations" className="inline-flex items-center gap-1.5 btn">
                      Open simulations
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/threat-model"
                      className="inline-flex items-center gap-1 eyebrow sm text-oxblood hover:text-ink transition-colors"
                    >
                      Build a threat model
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </NewsCard>

                <NewsCard accent="#8A6D2C">
                  <h3 className="news-card-title">Related tools in this library</h3>
                  <p className="news-card-copy mt-3">
                    The most relevant resources here are SecureDrop, Signal, Tor Browser, ProtonMail, and encrypted storage tools. They already live under the tools tab, which makes this merge cleaner than maintaining a separate manual page.
                  </p>
                </NewsCard>
              </div>
            </Motion.div>
          )}

          {/* ── AI security ────────────────────────────────────────── */}
          {activeTab === 'ai-security' && (
            <Motion.div
              key="ai-security"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <NewsNotice tone="danger" icon={ShieldAlert} className="notebook-warning">
                <h2 className="news-card-title text-oxblood">AI is not secure by default</h2>
                <p className="news-card-copy mt-1">
                  Commercial AI chatbots can log conversations, use them for model improvement, or expose them through legal demands and breaches.{' '}
                  <strong className="text-ink">Never input sensitive source information or unpublished findings.</strong>
                </p>
              </NewsNotice>

              {/* Never share */}
              <section>
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 01 · ${aiNeverShare.length} entries`}
                  title="Never share with AI chatbots"
                  lede="Data you should never input into commercial AI systems."
                  icon={ShieldAlert}
                  accent="#7B2E2E"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {aiNeverShare.map((item) => (
                    <WarningCard key={item.title} item={item} />
                  ))}
                </div>
              </section>

              {/* AI threats */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 02 · ${aiThreats.length} entries`}
                  title="AI threats to journalists"
                  lede="Emerging AI-powered threats targeting press freedom."
                  icon={AlertTriangle}
                  accent="#8A6D2C"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {aiThreats.map((item) => (
                    <WarningCard key={item.title} item={item} />
                  ))}
                </div>
              </section>

              {/* Privacy-respecting AI tools */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 03 · ${aiPrivacyTools.length} tools`}
                  title="Privacy-respecting AI tools"
                  lede="AI assistants with better privacy guarantees."
                  icon={Lock}
                  accent="#4D5D35"
                />
                <div className="news-ledger notebook-ledger">
                  {aiPrivacyTools.map((tool, i) => (
                    <GenericLedgerRow key={tool.name} tool={tool} index={i} color="#4D5D35" />
                  ))}
                </div>
              </section>

              {/* Protection & detection */}
              <section className="mt-12">
                <NewsSectionHeader
                  className="notebook-section"
                  kicker={`§ 04 · ${aiProtectionTools.length} tools`}
                  title="Protection & Detection Tools"
                  lede="Protect yourself from AI surveillance and detect synthetic media."
                  icon={Shield}
                  accent="#34515E"
                />
                <div className="news-ledger notebook-ledger">
                  {aiProtectionTools.map((tool, i) => (
                    <GenericLedgerRow key={tool.name} tool={tool} index={i} color="#34515E" />
                  ))}
                </div>
              </section>
            </Motion.div>
          )}

        </AnimatePresence>
      </div>
    </NewsPage>
  );
};

export default Resources;
