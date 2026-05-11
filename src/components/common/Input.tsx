import type { InputHTMLAttributes } from 'react'

export function Input({
  label,
  id,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; id?: string }) {
  const inputId = id ?? rest.name
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-[#FF8A50]/30 placeholder:text-gray-400 focus:border-[#FF8A50] focus:ring-2 ${className}`}
        {...rest}
      />
    </div>
  )
}
