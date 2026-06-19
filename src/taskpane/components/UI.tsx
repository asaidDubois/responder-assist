import React from "react";

export const TextField: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  canRevealPassword?: boolean;
  helperText?: string;
  onEnter?: () => void;
}> = ({ label, value, onChange, type = "text", placeholder, disabled, multiline, canRevealPassword, helperText, onEnter }) => {
  const [reveal, setReveal] = React.useState(false);
  const inputType = type === "password" && canRevealPassword ? (reveal ? "text" : "password") : type;
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div style={{ display: "flex", gap: 6 }}>
        {multiline ? (
          <textarea
            className="form-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            style={{ resize: "vertical" }}
          />
        ) : (
          <input
            className="form-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
          />
        )}
        {type === "password" && canRevealPassword && (
          <button
            type="button"
            className="btn btn-default"
            onClick={() => setReveal((r) => !r)}
            style={{ minWidth: 40 }}
            title={reveal ? "Masquer" : "Afficher"}
          >
            {reveal ? "🙈" : "👁"}
          </button>
        )}
      </div>
      {helperText && <div className="form-helper">{helperText}</div>}
    </div>
  );
};

export const Dropdown: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select
      className="form-input combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export const PrimaryButton: React.FC<{
  text: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ text, onClick, disabled }) => (
  <button className="btn btn-primary" onClick={onClick} disabled={disabled}>
    {text}
  </button>
);

export const DefaultButton: React.FC<{
  text: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ text, onClick, disabled }) => (
  <button className="btn btn-default" onClick={onClick} disabled={disabled}>
    {text}
  </button>
);

export const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, checked, onChange, disabled }) => (
  <div className="toggle-row">
    <span className="toggle-label">{label}</span>
    <button
      type="button"
      className={`toggle-switch ${checked ? "on" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
    />
  </div>
);

export const ChoiceGroup: React.FC<{
  label?: string;
  selectedKey: string;
  options: { key: string; text: string }[];
  onChange: (key: string) => void;
}> = ({ label, selectedKey, options, onChange }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <div className="choice-group">
      {options.map((o) => (
        <label key={o.key} className="choice">
          <input
            type="radio"
            name={label}
            checked={selectedKey === o.key}
            onChange={() => onChange(o.key)}
          />
          {o.text}
        </label>
      ))}
    </div>
  </div>
);

export const Spinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <span className="spinner" style={{ width: size, height: size }} />
);

export const MessageBar: React.FC<{
  type?: "error" | "success" | "info" | "warning";
  children: React.ReactNode;
}> = ({ type = "info", children }) => (
  <div className={`message message-${type}`}>{children}</div>
);

export const Tabs: React.FC<{
  selectedKey: string;
  onChange: (key: string) => void;
  items: { key: string; header: string; content: React.ReactNode }[];
}> = ({ selectedKey, onChange, items }) => (
  <>
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          aria-selected={selectedKey === it.key}
          className={`tab ${selectedKey === it.key ? "active" : ""}`}
          onClick={() => onChange(it.key)}
        >
          {it.header}
        </button>
      ))}
    </div>
    {items.find((it) => it.key === selectedKey)?.content}
  </>
);
