export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded-full bg-white/8" />
        <div className="h-10 w-full max-w-2xl rounded-full bg-white/10" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-white/6" />
      </div>
      <div className="rounded-[28px] border border-white/8 bg-black/20 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-14 rounded-[20px] bg-white/6" />
          <div className="h-14 rounded-[20px] bg-white/6" />
          <div className="h-48 rounded-[24px] bg-white/6" />
          <div className="h-48 rounded-[24px] bg-white/6" />
        </div>
      </div>
    </div>
  );
}
