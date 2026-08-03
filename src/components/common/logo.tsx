interface LogoProps {
  className?: string
}

export function Logo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <div className={className}>
      <img
        src="/logo.svg"
        alt="Tool Box Logo"
        className="block size-full dark:hidden"
      />
      <img
        src="/logo-dark.svg"
        alt="Tool Box Logo"
        className="hidden size-full dark:block"
      />
    </div>
  )
}
