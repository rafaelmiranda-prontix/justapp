export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Legal<span className="text-primary">Match</span>
        </h1>
        <p className="text-center text-xl text-muted-foreground">
          Conecte-se ao advogado ideal para o seu caso
        </p>
      </main>
    </div>
  )
}
