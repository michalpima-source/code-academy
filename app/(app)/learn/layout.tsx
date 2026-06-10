// Override parent (app) layout's overflow-y-auto for the lesson player,
// which needs a bounded height for its own inner scroll areas to work correctly.
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-hidden flex flex-col">{children}</div>
}
