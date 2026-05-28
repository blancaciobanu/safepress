const CrisisSwitch = ({
  checked,
  onClick,
  ariaLabel,
  trackStyle,
  thumbStyle,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    className={`relative h-7 w-14 flex-shrink-0 overflow-hidden border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-oxblood/35 ${className}`.trim()}
    style={trackStyle}
  >
    <span
      aria-hidden="true"
      className="absolute left-[2px] top-[2px] block h-[22px] w-[22px] transition-transform duration-200"
      style={{
        transform: checked ? 'translateX(28px)' : 'translateX(0)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        ...thumbStyle,
      }}
    />
  </button>
);

export default CrisisSwitch;
