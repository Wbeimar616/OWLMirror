
export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <h1 className="text-xl font-semibold">OwlMirror</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <h2 className="text-2xl font-bold">Página de Diagnóstico</h2>
        <p>Si puedes ver esto, la estructura básica de la página funciona.</p>
      </main>
    </div>
  );
}
