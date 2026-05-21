/**
 * Returns react-select styles based on current theme.
 * Pass `isDark = theme === 'dark'` from useTheme().
 */
export function getSelectStyles(isDark: boolean) {
  const ctrl    = isDark ? 'rgba(30,41,59,0.9)'  : '#ffffff';
  const border  = isDark ? '#475569'              : '#cbd5e1';
  const menuBg  = isDark ? '#1e293b'              : '#ffffff';
  const menuBdr = isDark ? 'rgba(139,92,246,0.3)' : '#e2e8f0';
  const optHov  = isDark ? '#334155'              : '#f1f5f9';
  const optSel  = isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)';
  const text    = isDark ? '#ffffff'              : '#1e293b';
  const muted   = isDark ? '#94a3b8'              : '#64748b';

  return {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: ctrl,
      borderColor: state.selectProps.value && state.selectProps.value.value !== 'all'
        ? '#3b82f6'
        : border,
      borderWidth: state.selectProps.value && state.selectProps.value.value !== 'all' ? '2px' : '1px',
      borderRadius: '0.75rem',
      padding: '0.10rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(139,92,246,0.5)' : 'none',
      minHeight: '42px',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: menuBg,
      border: `1px solid ${menuBdr}`,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({ ...base, padding: 0, maxHeight: '300px' }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? optSel : state.isFocused ? optHov : 'transparent',
      color: text,
      padding: '10px 12px',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      lineHeight: '1.3',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: text,
      whiteSpace: 'normal',
      overflow: 'visible',
      textOverflow: 'unset',
    }),
    valueContainer: (base: any) => ({
      ...base,
      whiteSpace: 'normal',
      overflow: 'visible',
    }),
    input:               (base: any) => ({ ...base, color: text }),
    placeholder:         (base: any) => ({ ...base, color: muted }),
    dropdownIndicator:   (base: any) => ({ ...base, color: muted, padding: '0 8px' }),
    clearIndicator:      (base: any) => ({
      ...base, color: muted, padding: '0 4px', cursor: 'pointer',
      '&:hover': { color: '#ef4444' },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
      borderRadius: '0.375rem',
    }),
    multiValueLabel:  (base: any) => ({ ...base, color: text }),
    multiValueRemove: (base: any) => ({
      ...base, color: muted,
      '&:hover': { backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' },
    }),
  };
}

export const scrollCls = `
  [scrollbar-width:thin]
  [scrollbar-color:rgb(71_85_105)_transparent]

  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-slate-600/60
  [&::-webkit-scrollbar-thumb]:border
  [&::-webkit-scrollbar-thumb]:border-slate-900/40

  hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/70
`;
