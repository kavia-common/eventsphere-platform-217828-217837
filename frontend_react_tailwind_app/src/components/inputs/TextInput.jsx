import React from 'react';

/**
 * PUBLIC_INTERFACE
 * TextInput: Labeled input with helper and error text.
 * Props:
 * - label, name, value, onChange, placeholder, type, error, helper
 */
export default function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
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
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
          error
            ? 'border-error focus:ring-error/30'
            : 'border-gray-300 focus:ring-primary/30 focus:border-primary'
        }`}
        {...rest}
      />
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
