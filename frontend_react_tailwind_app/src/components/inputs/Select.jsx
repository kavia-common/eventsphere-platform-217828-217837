import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Select: Labeled select box with options and error/helper.
 * Props:
 * - label, name, value, onChange, options: [{value,label}], error, helper
 */
export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  helper,
  ...rest
}) {
  const id = rest.id || name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-800">
          {label}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
          error
            ? 'border-error focus:ring-error/30'
            : 'border-gray-300 focus:ring-primary/30 focus:border-primary'
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
