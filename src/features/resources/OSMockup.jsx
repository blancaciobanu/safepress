import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, Check } from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────── */

const parseNavPath = (details) =>
  details.includes('→')
    ? details.split('→').map((s) => s.trim())
    : [details];

const isTurnOn  = (t) => /^(turn on|enable)/i.test(t);
const isTurnOff = (t) => /^(turn off|disable)/i.test(t);
const isToggle  = (t) => isTurnOn(t) || isTurnOff(t);

/* ─── Step animation hook ────────────────────────────────────────── */

function useStepAnimation(totalSteps, delayMs = 1200) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= totalSteps - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), delayMs);
    return () => clearTimeout(t);
  }, [step, totalSteps, delayMs]);
  return { step, replay: () => setStep(0) };
}

/* ─── Toggle/switch widgets ──────────────────────────────────────── */

const spring = { type: 'spring', stiffness: 500, damping: 30 };

const IOSToggle = ({ on }) => (
  <div style={{
    width: 34, height: 20, borderRadius: 10,
    background: on ? '#34C759' : '#E9E9EA',
    position: 'relative', transition: 'background 300ms', flexShrink: 0,
  }}>
    <motion.div animate={{ x: on ? 14 : 0 }} transition={spring}
      style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 1, left: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
  </div>
);

const MacToggle = ({ on }) => (
  <div style={{
    width: 36, height: 20, borderRadius: 10,
    background: on ? '#007AFF' : '#E0E0E0',
    position: 'relative', transition: 'background 300ms', flexShrink: 0,
  }}>
    <motion.div animate={{ x: on ? 16 : 0 }} transition={spring}
      style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 1, left: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
  </div>
);

const AndroidSwitch = ({ on }) => (
  <div style={{
    width: 36, height: 14, borderRadius: 7,
    background: on ? 'rgba(26,115,232,0.4)' : 'rgba(0,0,0,0.18)',
    position: 'relative', flexShrink: 0, alignSelf: 'center',
  }}>
    <motion.div animate={{ x: on ? 22 : 0 }} transition={spring}
      style={{
        width: 20, height: 20, borderRadius: '50%',
        background: on ? '#1A73E8' : '#BDBDBD',
        position: 'absolute', top: -3, left: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)', transition: 'background 300ms',
      }} />
  </div>
);

const Win11Toggle = ({ on }) => (
  <div style={{
    width: 38, height: 20, borderRadius: 10,
    background: on ? '#0078D4' : '#767676',
    position: 'relative', transition: 'background 300ms', flexShrink: 0,
  }}>
    <motion.div animate={{ x: on ? 18 : 0 }} transition={spring}
      style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: 2 }} />
  </div>
);

/* ─── Windows 11 ─────────────────────────────────────────────────── */

const WIN_SIDEBAR = ['System', 'Bluetooth & devices', 'Network & internet', 'Apps'];

const WindowsMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);

  return (
    <div style={{
      width: 310, background: '#FAFAFA',
      border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8,
      overflow: 'hidden', fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      {/* Title bar */}
      <div style={{
        height: 30, background: '#F3F3F3', display: 'flex', alignItems: 'center',
        padding: '0 0 0 10px', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <svg width="12" height="12" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
          <path fill="#0078D4" d="M0 0h7.5v7.5H0z"/>
          <path fill="#00A4EF" d="M8.5 0H16v7.5H8.5z"/>
          <path fill="#FFB900" d="M0 8.5h7.5V16H0z"/>
          <path fill="#7FBA00" d="M8.5 8.5H16V16H8.5z"/>
        </svg>
        <span style={{ fontSize: 11, color: '#1C1C1C', flex: 1 }}>Settings</span>
        <div style={{ display: 'flex' }}>
          {['─', '□', '×'].map((c, i) => (
            <div key={i} style={{
              width: 36, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, color: '#666',
            }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 178 }}>
        {/* Sidebar */}
        <div style={{
          width: 110, borderRight: '1px solid rgba(0,0,0,0.07)',
          paddingTop: 4, background: '#F7F7F7', overflowY: 'hidden',
        }}>
          {[...WIN_SIDEBAR, screenTitle].map((item, i) => {
            const active = item === screenTitle;
            return (
              <div key={i} style={{
                padding: '5px 10px', fontSize: 10.5,
                color: active ? '#0078D4' : '#444',
                background: active ? 'rgba(0,120,212,0.1)' : 'transparent',
                borderLeft: `2px solid ${active ? '#0078D4' : 'transparent'}`,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{item}</div>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.22 }}
            style={{ flex: 1, padding: '10px 12px', overflowY: 'hidden' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1C', marginBottom: 10 }}>
              {screenTitle}
            </div>
            {isFinalStep ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 4,
                background: 'rgba(0,120,212,0.07)', border: '1px solid rgba(0,120,212,0.2)',
              }}>
                <span style={{ fontSize: 10.5, color: '#1C1C1C', flex: 1, marginRight: 8,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {finalItem}
                </span>
                {isToggle(finalItem)
                  ? <Win11Toggle on={toggleOn} />
                  : <Check style={{ width: 12, height: 12, color: '#0078D4', flexShrink: 0 }} />}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {['General', activeItem, 'Advanced options'].map((item, i) => {
                  const hl = item === activeItem;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 8px', borderRadius: 4,
                      background: hl ? 'rgba(0,120,212,0.10)' : 'transparent',
                      border: `1px solid ${hl ? 'rgba(0,120,212,0.2)' : 'transparent'}`,
                    }}>
                      <span style={{ fontSize: 10.5, color: hl ? '#0078D4' : '#666',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {item}
                      </span>
                      <ChevronRight style={{ width: 9, height: 9, color: hl ? '#0078D4' : '#bbb', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── macOS ──────────────────────────────────────────────────────── */

const MACOS_SIDEBAR = ['General', 'Appearance', 'Accessibility', 'Control Centre'];

const MacOSMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);

  return (
    <div style={{
      width: 310, background: '#ECECEC',
      border: '1px solid rgba(0,0,0,0.16)', borderRadius: 10,
      overflow: 'hidden', position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    }}>
      {/* Title bar */}
      <div style={{
        height: 28, background: 'linear-gradient(180deg,#EBEBEB 0%,#D8D8D8 100%)',
        display: 'flex', alignItems: 'center', padding: '0 10px',
        borderBottom: '1px solid rgba(0,0,0,0.12)', gap: 6, position: 'relative',
      }}>
        {[['#FF5F57','rgba(196,0,0,0.5)'],['#FEBC2E','rgba(180,100,0,0.5)'],['#28C840','rgba(0,148,0,0.5)']].map(([bg], i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: bg, border: '0.5px solid rgba(0,0,0,0.15)' }} />
        ))}
        <span style={{
          fontSize: 11, fontWeight: 500, color: '#444',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>System Settings</span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 178 }}>
        {/* Sidebar */}
        <div style={{
          width: 110, background: 'rgba(0,0,0,0.04)',
          borderRight: '1px solid rgba(0,0,0,0.08)', paddingTop: 6, overflowY: 'hidden',
        }}>
          {[...MACOS_SIDEBAR, screenTitle].map((item, i) => {
            const active = item === screenTitle;
            return (
              <div key={i} style={{
                margin: '1px 4px', padding: '4px 8px', fontSize: 10.5, borderRadius: 5,
                background: active ? 'rgba(0,122,255,0.18)' : 'transparent',
                color: active ? '#007AFF' : '#444',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{item}</div>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ flex: 1, padding: '10px 12px', background: '#F5F5F5', overflowY: 'hidden' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1C', marginBottom: 10 }}>
              {screenTitle}
            </div>
            {isFinalStep ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', background: '#fff', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.1)',
              }}>
                <span style={{ fontSize: 10.5, color: '#1C1C1C', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {finalItem}
                </span>
                {isToggle(finalItem)
                  ? <MacToggle on={toggleOn} />
                  : <Check style={{ width: 12, height: 12, color: '#007AFF', flexShrink: 0, marginLeft: 8 }} />}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {['General', activeItem, 'Advanced'].map((item, i, arr) => {
                  const hl = item === activeItem;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      background: hl ? 'rgba(0,122,255,0.08)' : 'transparent',
                    }}>
                      <span style={{ fontSize: 10.5, color: hl ? '#007AFF' : '#444',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {item}
                      </span>
                      <ChevronRight style={{ width: 9, height: 9, color: hl ? '#007AFF' : '#bbb', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Linux terminal ─────────────────────────────────────────────── */

const LINUX_TOTAL_STEPS = 3;

const LinuxMockup = ({ navPath, step }) => {
  const command    = navPath[0];
  const configLine = navPath[1] ?? null;

  return (
    <div style={{
      width: 310, background: '#1A1B1E',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
      overflow: 'hidden', fontFamily: '"Geist Mono", "Fira Code", ui-monospace, monospace',
    }}>
      {/* Terminal title bar */}
      <div style={{
        height: 28, background: '#2C2D30', display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
      }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ fontSize: 10, color: '#888', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          bash — user@linux
        </span>
      </div>

      {/* Terminal body */}
      <div style={{ padding: '10px 14px', minHeight: 130 }}>
        {/* First prompt + command */}
        <div style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 2 }}>
          <span style={{ color: '#56B6C2' }}>user</span>
          <span style={{ color: '#888' }}>@</span>
          <span style={{ color: '#E5C07B' }}>linux</span>
          <span style={{ color: '#888' }}>:~$ </span>
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.span key="cursor"
                style={{ display: 'inline-block', width: 7, height: 12, background: '#4EC994', verticalAlign: 'middle' }}
                animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              />
            ) : (
              <motion.span key="cmd" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: '#E5C07B', wordBreak: 'break-all' }}>
                {command}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Config change line (step 2, when →) */}
        <AnimatePresence>
          {step >= 2 && configLine && (
            <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 11, marginBottom: 2 }}>
              <span style={{ color: '#888' }}>{'> '}</span>
              <span style={{ color: '#C678DD' }}>{configLine}</span>
            </motion.div>
          )}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: configLine ? 0.3 : 0 }}
              style={{ fontSize: 11, color: '#4EC994', marginBottom: 4 }}>
              Done.
            </motion.div>
          )}
        </AnimatePresence>

        {/* New prompt after completion */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontSize: 11 }}>
              <span style={{ color: '#56B6C2' }}>user</span>
              <span style={{ color: '#888' }}>@</span>
              <span style={{ color: '#E5C07B' }}>linux</span>
              <span style={{ color: '#888' }}>:~$ </span>
              <motion.span
                style={{ display: 'inline-block', width: 7, height: 12, background: '#4EC994', verticalAlign: 'middle' }}
                animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── iOS ────────────────────────────────────────────────────────── */

const IOS_FAKE = ['General', 'Accessibility', 'Notifications', 'Battery', 'Storage'];

const IOSMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);
  const backTitle   = step > 0 ? navPath[step - 1] : null;
  const truncate    = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <div style={{
      width: 190, background: '#F2F2F7',
      border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    }}>
      {/* Status bar */}
      <div style={{
        height: 20, background: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 10px', justifyContent: 'space-between',
        fontSize: 9, color: '#1C1C1E', fontWeight: 600,
        borderBottom: '0.5px solid rgba(0,0,0,0.1)',
      }}>
        <span>9:41</span>
        <span style={{ letterSpacing: '-0.02em' }}>●●● ▲ ▮</span>
      </div>

      {/* Nav bar */}
      <div style={{
        height: 36, background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', padding: '0 10px', position: 'relative',
      }}>
        {backTitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, color: '#007AFF', fontSize: 10, flexShrink: 0 }}>
            <ChevronRight style={{ width: 10, height: 10, transform: 'scaleX(-1)' }} />
            <span>{truncate(backTitle, 7)}</span>
          </div>
        )}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, fontWeight: 600, color: '#1C1C1E',
          whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {truncate(screenTitle, 13)}
        </div>
      </div>

      {/* Screen */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: step > 0 ? 18 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflowY: 'hidden' }}
        >
          {isFinalStep ? (
            <div style={{ padding: '8px 0' }}>
              <div style={{ background: '#fff', marginBottom: 8 }}>
                {['iPhone Unlock', 'iTunes & App Store', 'Password AutoFill'].map((item, i, arr) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: '#1C1C1E' }}>{item}</span>
                    <IOSToggle on={toggleOn} />
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: 6 }}>
                  <Check style={{ width: 10, height: 10, color: '#34C759', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#34C759', fontWeight: 500 }}>
                    {truncate(finalItem, 22)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <div style={{ background: '#fff', marginBottom: 8 }}>
                {[IOS_FAKE[0], activeItem, IOS_FAKE[1], IOS_FAKE[2]].map((item, i, arr) => {
                  const hl = item === activeItem;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: hl ? 'rgba(0,122,255,0.08)' : 'transparent',
                      borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                    }}>
                      <span style={{
                        fontSize: 11, color: hl ? '#007AFF' : '#1C1C1E', fontWeight: hl ? 500 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      }}>
                        {truncate(item, 18)}
                      </span>
                      <ChevronRight style={{ width: 9, height: 9, color: hl ? '#007AFF' : '#C7C7CC', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ background: '#fff' }}>
                {[IOS_FAKE[3], IOS_FAKE[4]].map((item, i, arr) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: '#1C1C1E' }}>{item}</span>
                    <ChevronRight style={{ width: 9, height: 9, color: '#C7C7CC' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Android ────────────────────────────────────────────────────── */

const ANDROID_FAKE = ['Display', 'Sound', 'Battery', 'Apps'];

const AndroidMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);
  const truncate    = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <div style={{
      width: 200, background: '#FAFAFA',
      border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8,
      overflow: 'hidden', fontFamily: '"Roboto", system-ui, sans-serif',
    }}>
      {/* Status bar */}
      <div style={{
        height: 18, background: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 10px', justifyContent: 'space-between',
        fontSize: 8, color: '#333', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontWeight: 500 }}>9:41</span>
        <span>▲ ◉</span>
      </div>

      {/* Top bar */}
      <div style={{
        height: 46, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          {[0,1,2].map((i) => <div key={i} style={{ width: 14, height: 1.5, background: '#444' }} />)}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {truncate(screenTitle, 14)}
        </span>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
        >
          {isFinalStep ? (
            <div>
              {['Device info', 'Storage', finalItem, 'Advanced'].map((item, i, arr) => {
                const isTarget = item === finalItem;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    background: isTarget ? 'rgba(26,115,232,0.06)' : 'transparent',
                  }}>
                    <span style={{
                      fontSize: 11, color: isTarget ? '#1A73E8' : '#444',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {truncate(item, 16)}
                    </span>
                    {isTarget
                      ? <AndroidSwitch on={isToggle(finalItem) ? toggleOn : true} />
                      : <ChevronRight style={{ width: 10, height: 10, color: '#bbb' }} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {[ANDROID_FAKE[0], activeItem, ANDROID_FAKE[1], ANDROID_FAKE[2]].map((item, i, arr) => {
                const hl = item === activeItem;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    background: hl ? 'rgba(26,115,232,0.06)' : 'transparent',
                  }}>
                    <span style={{
                      fontSize: 11, color: hl ? '#1A73E8' : '#444', fontWeight: hl ? 500 : 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {truncate(item, 16)}
                    </span>
                    <ChevronRight style={{ width: 10, height: 10, color: hl ? '#1A73E8' : '#bbb' }} />
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Path breadcrumb ────────────────────────────────────────────── */

const PathProgress = ({ navPath, step, osColor }) => (
  <div style={{
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3,
    maxWidth: 320, marginTop: 10,
  }}>
    {navPath.map((seg, i) => (
      <Fragment key={i}>
        {i > 0 && (
          <ChevronRight style={{ width: 8, height: 8, color: 'var(--color-smoke-dim)', flexShrink: 0 }} />
        )}
        <motion.span
          animate={{ color: i <= step ? osColor : 'var(--color-smoke-dim)' }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.05em',
            fontWeight: i === step ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {seg.length > 22 ? seg.slice(0, 20) + '…' : seg}
        </motion.span>
      </Fragment>
    ))}
  </div>
);

/* ─── Main export ────────────────────────────────────────────────── */

const MOCKUPS = {
  windows: WindowsMockup,
  macos:   MacOSMockup,
  linux:   LinuxMockup,
  ios:     IOSMockup,
  android: AndroidMockup,
};

const OS_COLORS = {
  windows: '#0078D4',
  macos:   '#007AFF',
  linux:   '#4EC994',
  ios:     '#007AFF',
  android: '#1A73E8',
};

export const OSMockup = ({ osId, step: stepData }) => {
  const navPath    = parseNavPath(stepData.details);
  const isLinux    = osId === 'linux';
  // Linux always uses 3 internal steps; GUI OSes: one step per nav screen (all but last item)
  const totalSteps = isLinux ? LINUX_TOTAL_STEPS : Math.max(navPath.length - 1, 1);
  const { step, replay } = useStepAnimation(totalSteps);
  const MockupComp = MOCKUPS[osId];
  const osColor    = OS_COLORS[osId] ?? '#15110C';
  const isDone     = step === totalSteps - 1;

  // For Linux, clamp the step passed to the mockup to navPath bounds
  const mockupStep = isLinux ? Math.min(step, navPath.length - 1) : step;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start' }}>
      {MockupComp && <MockupComp navPath={navPath} step={mockupStep} />}

      <PathProgress navPath={navPath} step={isLinux ? (step >= 1 ? 0 : -1) : step} osColor={osColor} />

      <button
        type="button"
        onClick={replay}
        style={{
          marginTop: 10,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'transparent',
          border: '1px solid rgba(21,17,12,0.18)',
          borderRadius: 2,
          color: isDone ? 'var(--color-smoke)' : 'var(--color-smoke-dim)',
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '4px 8px',
          cursor: 'pointer',
          transition: 'color 200ms, border-color 200ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'rgba(21,17,12,0.35)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = isDone ? 'var(--color-smoke)' : 'var(--color-smoke-dim)'; e.currentTarget.style.borderColor = 'rgba(21,17,12,0.18)'; }}
      >
        <RotateCcw style={{ width: 9, height: 9 }} />
        Replay
      </button>
    </div>
  );
};
