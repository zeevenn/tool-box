interface LogoProps {
  className?: string
}

export function Logo({ className = 'w-8 h-8' }: LogoProps) {
  const baseUrl = import.meta.env.BASE_URL

  return (
    <div className={className}>
      <img
        src={`${baseUrl}logo.svg`}
        alt="Tool Box Logo"
        className="block size-full dark:hidden"
      />
      <img
        src={`${baseUrl}logo-dark.svg`}
        alt="Tool Box Logo"
        className="hidden size-full dark:block"
      />
    </div>
  )
}
