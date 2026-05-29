import { useState, useEffect, Fragment } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, Check, Search } from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────── */

const parseNavPath = (details) =>
  details.includes('→') ? details.split('→').map((s) => s.trim()) : [details];

const isTurnOn  = (t) => /^(turn on|enable)/i.test(t);
const isTurnOff = (t) => /^(turn off|disable)/i.test(t);
const isToggle  = (t) => isTurnOn(t) || isTurnOff(t);
const trunc     = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

/* ─── Step animation hook ────────────────────────────────────────── */

function useStepAnimation(totalSteps, delayMs = 1400) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= totalSteps - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), delayMs);
    return () => clearTimeout(t);
  }, [step, totalSteps, delayMs]);
  return { step, replay: () => setStep(0) };
}

/* ─── Toggle widgets ─────────────────────────────────────────────── */

const spring = { type: 'spring', stiffness: 480, damping: 28 };

const IOSToggle = ({ on }) => (
  <div style={{
    width: 44, height: 26, borderRadius: 13,
    background: on ? '#34C759' : '#E9E9EA',
    position: 'relative', transition: 'background 300ms', flexShrink: 0,
  }}>
    <Motion.div animate={{ x: on ? 18 : 0 }} transition={spring}
      style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: 2,
        boxShadow: '0 2px 6px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.06)' }} />
  </div>
);

const MacToggle = ({ on }) => (
  <div style={{
    width: 44, height: 26, borderRadius: 13,
    background: on ? '#007AFF' : '#D1D1D6',
    position: 'relative', transition: 'background 350ms', flexShrink: 0,
  }}>
    <Motion.div animate={{ x: on ? 18 : 0 }} transition={spring}
      style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: 2,
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} />
  </div>
);

const AndroidSwitch = ({ on }) => (
  <div style={{
    width: 44, height: 18, borderRadius: 9,
    background: on ? 'rgba(26,115,232,0.5)' : 'rgba(0,0,0,0.18)',
    position: 'relative', flexShrink: 0, alignSelf: 'center',
    transition: 'background 300ms',
  }}>
    <Motion.div animate={{ x: on ? 26 : 0 }} transition={spring}
      style={{ width: 24, height: 24, borderRadius: '50%',
        background: on ? '#1A73E8' : '#BDBDBD',
        position: 'absolute', top: -3, left: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.28)', transition: 'background 300ms' }} />
  </div>
);

const Win11Toggle = ({ on }) => (
  <div style={{
    width: 44, height: 22, borderRadius: 11,
    background: on ? '#0078D4' : '#767676',
    position: 'relative', transition: 'background 300ms', flexShrink: 0,
  }}>
    <Motion.div animate={{ x: on ? 22 : 0 }} transition={spring}
      style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: 2 }} />
  </div>
);

/* ─── Windows 11 ─────────────────────────────────────────────────── */

const WIN_SIDEBAR = [
  { label: 'System',              color: '#0078D4' },
  { label: 'Bluetooth & devices', color: '#744DA9' },
  { label: 'Network & internet',  color: '#107C10' },
  { label: 'Apps',                color: '#8764B8' },
  { label: 'Accounts',            color: '#0078D4' },
  { label: 'Privacy & security',  color: '#107C10' },
  { label: 'Update & Security',   color: '#107C10' },
];

const WinIcon = ({ color }) => (
  <div style={{ width: 15, height: 15, borderRadius: 3, background: color, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 6, height: 6, borderRadius: 1, background: 'rgba(255,255,255,0.75)' }} />
  </div>
);

const WindowsMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);

  const matchedSidebar = WIN_SIDEBAR.find((i) =>
    screenTitle.toLowerCase().split(' ').some((w) => i.label.toLowerCase().includes(w))
  ) ?? { label: screenTitle, color: '#0078D4' };

  const sidebarItems = [WIN_SIDEBAR[0], WIN_SIDEBAR[1], WIN_SIDEBAR[2], matchedSidebar, WIN_SIDEBAR[5], WIN_SIDEBAR[6]]
    .filter((item, i, arr) => arr.findIndex((x) => x.label === item.label) === i);

  return (
    <div style={{
      width: 440, background: '#FAFAFA',
      border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, overflow: 'hidden',
      fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    }}>
      {/* Title bar */}
      <div style={{
        height: 32, background: '#F3F3F3', display: 'flex', alignItems: 'center',
        padding: '0 0 0 12px', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
          <path fill="#0078D4" d="M0 0h7.5v7.5H0z"/><path fill="#00A4EF" d="M8.5 0H16v7.5H8.5z"/>
          <path fill="#FFB900" d="M0 8.5h7.5V16H0z"/><path fill="#7FBA00" d="M8.5 8.5H16V16H8.5z"/>
        </svg>
        <span style={{ fontSize: 12, color: '#1C1C1C', flex: 1 }}>Settings</span>
        <div style={{ display: 'flex' }}>
          {['─', '□', '×'].map((c, i) => (
            <div key={i} style={{ width: 40, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, color: '#666' }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 228 }}>
        {/* Sidebar */}
        <div style={{ width: 148, borderRight: '1px solid rgba(0,0,0,0.07)', background: '#F7F7F7',
          display: 'flex', flexDirection: 'column', paddingTop: 6, overflowY: 'hidden' }}>
          <div style={{ margin: '0 8px 6px', padding: '5px 8px', background: '#EBEBEB', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 5 }}>
            <Search style={{ width: 10, height: 10, color: '#888', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic' }}>Find a setting</span>
          </div>
          {sidebarItems.map((item, i) => {
            const active = item.label === matchedSidebar.label;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 11,
                color: active ? '#0078D4' : '#333',
                background: active ? 'rgba(0,120,212,0.1)' : 'transparent',
                borderLeft: `2px solid ${active ? '#0078D4' : 'transparent'}`,
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                <WinIcon color={active ? '#0078D4' : item.color} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <Motion.div key={step}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, padding: '12px 18px', overflowY: 'hidden' }}
          >
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              {navPath.slice(0, Math.min(step + 1, 4)).map((seg, i) => (
                <Fragment key={i}>
                  {i > 0 && <ChevronRight style={{ width: 8, height: 8, color: '#aaa' }} />}
                  <span style={{ fontSize: 10, color: i === step ? '#1C1C1C' : '#999' }}>{trunc(seg, 18)}</span>
                </Fragment>
              ))}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#1C1C1C', marginBottom: 12 }}>{screenTitle}</div>
            {isFinalStep ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 4,
                background: 'rgba(0,120,212,0.07)', border: '1px solid rgba(0,120,212,0.2)' }}>
                <div style={{ flex: 1, marginRight: 12, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, color: '#1C1C1C', marginBottom: 3 }}>{trunc(finalItem, 30)}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>
                    {isTurnOn(finalItem) ? 'Feature will be enabled' : isTurnOff(finalItem) ? 'Feature disabled' : 'Setting configured'}
                  </div>
                </div>
                {isToggle(finalItem)
                  ? <Win11Toggle on={toggleOn} />
                  : <Check style={{ width: 16, height: 16, color: '#0078D4', flexShrink: 0 }} />}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {['General', activeItem, 'Advanced options'].map((item, i) => {
                  const hl = item === activeItem;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: 4,
                      background: hl ? 'rgba(0,120,212,0.09)' : 'rgba(0,0,0,0.025)',
                      border: `1px solid ${hl ? 'rgba(0,120,212,0.22)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 12, color: hl ? '#0078D4' : '#333', marginBottom: 2 }}>{trunc(item, 28)}</div>
                        <div style={{ fontSize: 10, color: '#999' }}>
                          {hl ? 'Manage settings and options' : 'Configure preferences'}
                        </div>
                      </div>
                      <ChevronRight style={{ width: 10, height: 10, color: hl ? '#0078D4' : '#bbb', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </Motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── macOS ──────────────────────────────────────────────────────── */

const MACOS_SIDEBAR = [
  { label: 'General',           color: '#888888' },
  { label: 'Appearance',        color: '#5856D6' },
  { label: 'Accessibility',     color: '#007AFF' },
  { label: 'Control Centre',    color: '#1C1C1E' },
  { label: 'Privacy & Security',color: '#34C759' },
  { label: 'Network',           color: '#007AFF' },
  { label: 'Software Update',   color: '#007AFF' },
  { label: 'Users & Groups',    color: '#888888' },
  { label: 'Lock Screen',       color: '#888888' },
];

const MacIcon = ({ color }) => (
  <div style={{ width: 18, height: 18, borderRadius: 5, background: color, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 7, height: 7, borderRadius: 1.5, background: 'rgba(255,255,255,0.78)' }} />
  </div>
);

const MacOSMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);

  const matchedSidebar = MACOS_SIDEBAR.find((i) =>
    screenTitle.toLowerCase().split(' ').some((w) => w.length > 3 && i.label.toLowerCase().includes(w))
  ) ?? { label: screenTitle, color: '#888888' };

  const sidebarItems = [MACOS_SIDEBAR[0], MACOS_SIDEBAR[2], MACOS_SIDEBAR[4], matchedSidebar, MACOS_SIDEBAR[5], MACOS_SIDEBAR[6]]
    .filter((item, i, arr) => arr.findIndex((x) => x.label === item.label) === i);

  return (
    <div style={{
      width: 440, background: '#ECECEC',
      border: '1px solid rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden', position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    }}>
      {/* Title bar */}
      <div style={{ height: 32, background: 'linear-gradient(180deg,#E8E8E8 0%,#CECECE 100%)',
        display: 'flex', alignItems: 'center', padding: '0 12px',
        borderBottom: '1px solid rgba(0,0,0,0.15)', gap: 7, position: 'relative' }}>
        {[['#FF5F57'], ['#FEBC2E'], ['#28C840']].map(([bg], i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: bg,
            border: '0.5px solid rgba(0,0,0,0.18)' }} />
        ))}
        <span style={{ fontSize: 12, fontWeight: 500, color: '#333',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>System Settings</span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', height: 224 }}>
        {/* Sidebar */}
        <div style={{ width: 152, background: 'rgba(0,0,0,0.045)',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', paddingTop: 6, overflowY: 'hidden' }}>
          <div style={{ margin: '0 6px 6px', padding: '5px 9px', background: '#fff',
            borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5,
            border: '1px solid rgba(0,0,0,0.12)' }}>
            <Search style={{ width: 10, height: 10, color: '#aaa', flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: '#bbb' }}>Search</span>
          </div>
          {sidebarItems.map((item, i) => {
            const active = item.label === matchedSidebar.label;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                margin: '1px 5px', padding: '5px 7px', borderRadius: 6, fontSize: 11.5,
                background: active ? 'rgba(0,122,255,0.18)' : 'transparent',
                color: active ? '#007AFF' : '#333',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                <MacIcon color={active ? '#007AFF' : item.color} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <Motion.div key={step}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.24 }}
            style={{ flex: 1, padding: '14px 18px', background: '#F5F5F5', overflowY: 'hidden' }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1C1C1C', marginBottom: 14 }}>{screenTitle}</div>
            {isFinalStep ? (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, color: '#1C1C1C', marginBottom: 3 }}>{trunc(finalItem, 30)}</div>
                    <div style={{ fontSize: 10.5, color: '#888' }}>
                      {isTurnOn(finalItem) ? 'Enabled' : isTurnOff(finalItem) ? 'Disabled' : 'Configured'}
                    </div>
                  </div>
                  {isToggle(finalItem)
                    ? <MacToggle on={toggleOn} />
                    : <Check style={{ width: 16, height: 16, color: '#007AFF', marginLeft: 14, flexShrink: 0 }} />}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {['Preferences', activeItem, 'Advanced'].map((item, i, arr) => {
                  const hl = item === activeItem;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px',
                      borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                      background: hl ? 'rgba(0,122,255,0.07)' : 'transparent',
                    }}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 13, color: hl ? '#007AFF' : '#333', marginBottom: 2 }}>{trunc(item, 28)}</div>
                        <div style={{ fontSize: 10.5, color: '#aaa' }}>{hl ? 'Tap to configure' : 'Manage'}</div>
                      </div>
                      <ChevronRight style={{ width: 10, height: 10, color: hl ? '#007AFF' : '#ccc', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </Motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Linux terminal ─────────────────────────────────────────────── */

const LINUX_TOTAL_STEPS = 3;

const getLinuxOutput = (cmd) => {
  if (/ufw/.test(cmd))         return ['Rules updated', 'Rules updated (v6)', 'Firewall is active and enabled on system startup'];
  if (/cryptsetup/.test(cmd))  return ['WARNING: /dev/sdX not found, continuing', 'Enter passphrase:', 'Key slot 0 created successfully'];
  if (/fail2ban/.test(cmd))    return ['Reading package lists... Done', 'Selecting fail2ban (1.0.2-1)', 'Setting up fail2ban... OK'];
  if (/apt install/.test(cmd)) return ['Reading package lists... Done', 'Building dependency tree', 'Processing triggers for systemd ...'];
  if (/nano/.test(cmd))        return ['File opened. Press Ctrl+X to exit.', '', 'File saved successfully'];
  if (/passwd/.test(cmd))      return ['Changing password for user', 'New password:', 'passwd: password updated successfully'];
  return ['Processing...', '', 'Done.'];
};

const LinuxMockup = ({ navPath, step }) => {
  const command    = navPath[0];
  const configLine = navPath[1] ?? null;
  const output     = getLinuxOutput(command);

  const [typed, setTyped] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (step < 1) { setTyped(0); return; }
    if (step >= 2) { setTyped(command.length); return; }
    /* eslint-enable react-hooks/set-state-in-effect */
    if (typed >= command.length) return;
    const t = setTimeout(() => setTyped((c) => c + 1), 22);
    return () => clearTimeout(t);
  }, [step, typed, command.length]);

  const displayCmd   = step >= 2 ? command : command.slice(0, typed);
  const cursorOnCmd  = step < 2;
  const isSudo       = command.startsWith('sudo ');

  return (
    <div style={{
      width: 440, background: '#1A1B1E',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden',
      fontFamily: '"Geist Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    }}>
      {/* Title bar */}
      <div style={{ height: 32, background: '#2C2D30', display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c,
            border: '0.5px solid rgba(0,0,0,0.2)' }} />
        ))}
        <span style={{ fontSize: 11, color: '#6E6E6E', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          bash — user@linux:~
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px', minHeight: 150 }}>
        {/* Prompt + command */}
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          <span style={{ color: '#56B6C2' }}>user</span>
          <span style={{ color: '#555' }}>@</span>
          <span style={{ color: '#E5C07B' }}>linux</span>
          <span style={{ color: '#4EC994' }}>:~</span>
          <span style={{ color: '#ABB2BF' }}>$ </span>
          {step >= 1 && (
            isSudo
              ? <><span style={{ color: '#C678DD' }}>sudo </span><span style={{ color: '#E5C07B' }}>{displayCmd.slice(5)}</span></>
              : <span style={{ color: '#E5C07B' }}>{displayCmd}</span>
          )}
          {cursorOnCmd && (
            <Motion.span style={{ display: 'inline-block', width: 7, height: 13,
              background: '#4EC994', verticalAlign: 'text-bottom', marginLeft: 1 }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.55, repeat: Infinity, repeatType: 'reverse' }} />
          )}
        </div>

        {/* Config line (when details had →) */}
        <AnimatePresence>
          {step >= 2 && configLine && (
            <Motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ fontSize: 12, marginTop: 2, color: '#5C6370' }}>
              <span style={{ color: '#888' }}>{'# '}</span>
              <span style={{ color: '#C678DD' }}>{configLine}</span>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Output lines */}
        <AnimatePresence>
          {step >= 2 && (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              {output.map((line, i) => (
                <Motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.15 }}
                  style={{ fontSize: 12, lineHeight: 1.6,
                    color: i === output.length - 1 ? '#4EC994' : '#5C6370' }}>
                  {line}
                </Motion.div>
              ))}
              {/* New prompt */}
              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + output.length * 0.15 }}
                style={{ fontSize: 13, marginTop: 4 }}>
                <span style={{ color: '#56B6C2' }}>user</span>
                <span style={{ color: '#555' }}>@</span>
                <span style={{ color: '#E5C07B' }}>linux</span>
                <span style={{ color: '#4EC994' }}>:~</span>
                <span style={{ color: '#ABB2BF' }}>$ </span>
                <Motion.span style={{ display: 'inline-block', width: 7, height: 13,
                  background: '#4EC994', verticalAlign: 'text-bottom', marginLeft: 1 }}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity, repeatType: 'reverse' }} />
              </Motion.div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── iOS ────────────────────────────────────────────────────────── */

const IOS_ICON_COLORS = {
  'General':              '#8E8E93',
  'Accessibility':        '#007AFF',
  'Privacy & Security':   '#34C759',
  'Privacy':              '#34C759',
  'Notifications':        '#FF3B30',
  'Battery':              '#34C759',
  'Face ID & Passcode':   '#1C1C1E',
  'Touch ID & Passcode':  '#1C1C1E',
  'Passcode':             '#1C1C1E',
  'Find My':              '#34C759',
  'iCloud':               '#007AFF',
  'Tracking':             '#007AFF',
  'Emergency SOS':        '#FF3B30',
  'Lock Screen':          '#8E8E93',
  'Screen Time':          '#5856D6',
  'Sounds & Haptics':     '#FF6B6B',
};

const IOSIcon = ({ label }) => {
  const color = IOS_ICON_COLORS[label] ?? '#8E8E93';
  return (
    <div style={{ width: 28, height: 28, borderRadius: 7, background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
      <div style={{ width: 11, height: 11, borderRadius: 2.5, background: 'rgba(255,255,255,0.82)' }} />
    </div>
  );
};

const IOS_ROW = ({ item, highlighted, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px',
    background: highlighted ? 'rgba(0,122,255,0.07)' : 'transparent',
    borderBottom: last ? 'none' : '0.5px solid rgba(0,0,0,0.09)',
  }}>
    <IOSIcon label={item} />
    <span style={{ flex: 1, fontSize: 14, color: highlighted ? '#007AFF' : '#1C1C1E',
      fontWeight: highlighted ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {trunc(item, 18)}
    </span>
    <ChevronRight style={{ width: 11, height: 11, color: highlighted ? '#007AFF' : '#C7C7CC', flexShrink: 0 }} />
  </div>
);

const IOS_SECTION_LABEL = ({ text }) => (
  <div style={{ fontSize: 11, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '10px 16px 4px', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
    {text}
  </div>
);

const IOSMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);
  const backTitle   = step > 0 ? navPath[step - 1] : null;

  return (
    <div style={{
      width: 260, background: '#F2F2F7',
      border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      boxShadow: '0 14px 44px rgba(0,0,0,0.16)',
    }}>
      {/* Status bar */}
      <div style={{ height: 24, background: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 16px', justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.01em' }}>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Signal bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
            {[5, 8, 11, 14].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, background: '#1C1C1E', borderRadius: 1 }} />
            ))}
          </div>
          {/* Wifi */}
          <svg width="14" height="11" viewBox="0 0 14 11">
            <path d="M7 9a1.2 1.2 0 1 0 0 2.4A1.2 1.2 0 0 0 7 9z" fill="#1C1C1E"/>
            <path d="M4 6.5C5 5.3 6 4.7 7 4.7s2 .6 3 1.8" stroke="#1C1C1E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <path d="M1 3.5C3 1.2 5 0 7 0s4 1.2 6 3.5" stroke="#1C1C1E" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          </svg>
          {/* Battery */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 22, height: 11, borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.35)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: '82%', background: '#1C1C1E', borderRadius: 1.5 }} />
            </div>
            <div style={{ width: 2, height: 5, background: 'rgba(0,0,0,0.35)', borderRadius: '0 1px 1px 0', marginLeft: 1 }} />
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <AnimatePresence mode="wait">
        <Motion.div key={`nav-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ minHeight: 42, background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', padding: '0 14px', position: 'relative' }}>
          {backTitle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#007AFF', fontSize: 12, position: 'absolute', left: 14 }}>
              <ChevronRight style={{ width: 13, height: 13, transform: 'scaleX(-1)' }} />
              <span>{trunc(backTitle, 9)}</span>
            </div>
          )}
          <div style={{ width: '100%', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#1C1C1E',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 72px' }}>
            {trunc(screenTitle, 16)}
          </div>
        </Motion.div>
      </AnimatePresence>

      {/* Screen content */}
      <AnimatePresence mode="wait">
        <Motion.div key={step}
          initial={{ opacity: 0, x: step > 0 ? 36 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflowY: 'hidden' }}
        >
          {isFinalStep ? (
            <div style={{ padding: '8px 0 12px' }}>
              <IOS_SECTION_LABEL text={isTurnOn(finalItem) ? 'Use for authentication' : 'Security'} />
              <div style={{ background: '#fff', marginBottom: 8 }}>
                {['iPhone Unlock', 'iTunes & App Store', 'Password AutoFill'].map((item, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.1)' : 'none' }}>
                    <span style={{ fontSize: 14, color: '#1C1C1E' }}>{item}</span>
                    <IOSToggle on={toggleOn} />
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#34C759', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check style={{ width: 12, height: 12, color: '#fff' }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#1C1C1E' }}>{trunc(finalItem, 24)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '8px 0 12px' }}>
              <IOS_SECTION_LABEL text="General" />
              <div style={{ background: '#fff', marginBottom: 8 }}>
                <IOS_ROW item="General" highlighted={activeItem === 'General'} />
                <IOS_ROW item={activeItem} highlighted last={false} />
                <IOS_ROW item="Accessibility" highlighted={activeItem === 'Accessibility'} last />
              </div>
              <IOS_SECTION_LABEL text="Privacy & Security" />
              <div style={{ background: '#fff' }}>
                <IOS_ROW item="Notifications" highlighted={activeItem === 'Notifications'} />
                <IOS_ROW item="Battery" highlighted={activeItem === 'Battery'} last />
              </div>
            </div>
          )}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Android ────────────────────────────────────────────────────── */

const DROID_ICON_COLORS = {
  'Display':        '#FF6D00', 'Sound':          '#7B1FA2', 'Battery':     '#2E7D32',
  'Apps':           '#1565C0', 'Accounts':       '#1A73E8', 'Security':    '#D32F2F',
  'Location':       '#388E3C', 'Privacy':        '#7B1FA2', 'Storage':     '#F57C00',
  'Find My Device': '#1A73E8', 'Notifications':  '#D32F2F', 'Accessibility': '#0277BD',
};

const DroidIcon = ({ label }) => {
  const color = DROID_ICON_COLORS[label] ?? '#666';
  return (
    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}1A`,
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 16, height: 16, borderRadius: 4, background: color, opacity: 0.9 }} />
    </div>
  );
};

const DroidRow = ({ item, highlighted, subtitle, control }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px',
    background: highlighted ? 'rgba(26,115,232,0.06)' : 'transparent' }}>
    <DroidIcon label={item} />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 13, color: highlighted ? '#1A73E8' : '#202124', fontWeight: highlighted ? 500 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {trunc(item, 18)}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: highlighted ? '#4A8ED4' : '#5F6368', marginTop: 1 }}>{subtitle}</div>
      )}
    </div>
    {control ?? <ChevronRight style={{ width: 12, height: 12, color: highlighted ? '#1A73E8' : '#bbb', flexShrink: 0 }} />}
  </div>
);

const AndroidMockup = ({ navPath, step }) => {
  const screenTitle = navPath[step] ?? navPath[0];
  const activeItem  = navPath[step + 1] ?? navPath[navPath.length - 1];
  const isFinalStep = step === navPath.length - 2;
  const finalItem   = navPath[navPath.length - 1];
  const toggleOn    = !isTurnOff(finalItem);

  return (
    <div style={{
      width: 260, background: '#FAFAFA',
      border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden',
      fontFamily: '"Roboto", system-ui, sans-serif',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    }}>
      {/* Status bar */}
      <div style={{ height: 20, background: '#fff', display: 'flex', alignItems: 'center',
        padding: '0 12px', justifyContent: 'space-between', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#202124' }}>9:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            {[4, 7, 10, 13].map((h, i) => (
              <div key={i} style={{ width: 2.5, height: h, background: i < 3 ? '#1A73E8' : '#ccc', borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ width: 18, height: 9, borderRadius: 2, border: '1px solid #888', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 1, top: 1, bottom: 1, width: '72%', background: '#34A853', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ height: 52, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {[0,1,2].map((i) => <div key={i} style={{ width: 16, height: 1.5, background: '#444' }} />)}
        </div>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trunc(screenTitle, 14)}
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px 4px' }}>
        <div style={{ background: '#F1F3F4', borderRadius: 22,
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}>
          <Search style={{ width: 14, height: 14, color: '#5F6368', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#9AA0A6' }}>Search settings</span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <Motion.div key={step}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          {isFinalStep ? (
            <div style={{ padding: '4px 0 8px' }}>
              {['Storage', 'Location', finalItem, 'Accessibility'].map((item, i) => {
                const isTarget = item === finalItem;
                return (
                  <DroidRow key={i} item={item} highlighted={isTarget}
                    subtitle={isTarget ? (isTurnOn(finalItem) ? 'Enabled' : isTurnOff(finalItem) ? 'Disabled' : 'Configured') : 'Manage'}
                    control={isTarget
                      ? <AndroidSwitch on={isToggle(finalItem) ? toggleOn : true} />
                      : <ChevronRight style={{ width: 12, height: 12, color: '#bbb' }} />}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '4px 0 8px' }}>
              {['Display', activeItem, 'Sound', 'Battery'].map((item, i) => (
                <DroidRow key={i} item={item} highlighted={item === activeItem}
                  subtitle={item === activeItem ? 'Tap to configure' : 'Manage preferences'} />
              ))}
            </div>
          )}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Path breadcrumb ────────────────────────────────────────────── */

const PathProgress = ({ navPath, step, osColor }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 14 }}>
    {navPath.map((seg, i) => (
      <Fragment key={i}>
        {i > 0 && <ChevronRight style={{ width: 9, height: 9, color: 'var(--color-smoke-dim)', flexShrink: 0 }} />}
        <Motion.span animate={{ color: i <= step ? osColor : 'var(--color-smoke-dim)' }} transition={{ duration: 0.4 }}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.05em',
            fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>
          {seg.length > 26 ? seg.slice(0, 24) + '…' : seg}
        </Motion.span>
      </Fragment>
    ))}
  </div>
);

/* ─── Main export ────────────────────────────────────────────────── */

const MOCKUPS = {
  windows: WindowsMockup, macos: MacOSMockup, linux: LinuxMockup, ios: IOSMockup, android: AndroidMockup,
};

const OS_COLORS = {
  windows: '#0078D4', macos: '#007AFF', linux: '#4EC994', ios: '#007AFF', android: '#1A73E8',
};

export const OSMockup = ({ osId, step: stepData }) => {
  const navPath    = parseNavPath(stepData.details);
  const isLinux    = osId === 'linux';
  const totalSteps = isLinux ? LINUX_TOTAL_STEPS : Math.max(navPath.length - 1, 1);
  const { step, replay } = useStepAnimation(totalSteps);
  const MockupComp = MOCKUPS[osId];
  const osColor    = OS_COLORS[osId] ?? '#15110C';
  const isDone     = step === totalSteps - 1;
  const mockupStep = isLinux ? Math.min(step, navPath.length - 1) : step;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {MockupComp && <MockupComp navPath={navPath} step={mockupStep} />}
      <PathProgress navPath={navPath} step={isLinux ? (step >= 1 ? 0 : -1) : step} osColor={osColor} />
      <button type="button" onClick={replay} style={{
        marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'transparent', border: '1px solid rgba(21,17,12,0.18)', borderRadius: 2,
        color: isDone ? 'var(--color-smoke)' : 'var(--color-smoke-dim)',
        fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em',
        textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer',
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
