export function ComingSoon({ title, faz }: { title: string; faz: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-24 text-center">
      <i className="ti ti-tools mb-3 text-3xl text-slate-300" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-bt-navy-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">Bu modül {faz} kapsamında geliştirilecek.</p>
    </div>
  )
}
