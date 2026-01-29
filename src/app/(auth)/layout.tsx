export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Legal<span className="text-primary">Match</span>
          </h1>
          <p className="text-gray-600 mt-2">Conecte-se ao advogado ideal</p>
        </div>
        {children}
      </div>
    </div>
  )
}
