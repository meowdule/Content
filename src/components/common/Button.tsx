import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

const variantClass: Record<Variant, string> = {
  primary:
    'bg-[#FF8A50] text-white hover:bg-[#ff7a3d] shadow-sm disabled:opacity-50 disabled:pointer-events-none',
  outline:
    'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
