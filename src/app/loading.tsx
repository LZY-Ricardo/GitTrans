export default function Loading() {
  return (
    <main className="mx-auto mt-12 w-[min(1200px,calc(100%-24px))]">
      <div className="animate-pulse rounded-[36px] border border-white/70 bg-white/70 px-8 py-10 shadow-[0_32px_100px_rgba(71,28,19,0.08)]">
        <div className="h-4 w-40 rounded-full bg-brand-100" />
        <div className="mt-6 h-14 w-full max-w-3xl rounded-[28px] bg-brand-50" />
        <div className="mt-4 h-6 w-full max-w-2xl rounded-full bg-ink/8" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 rounded-[28px] bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}
