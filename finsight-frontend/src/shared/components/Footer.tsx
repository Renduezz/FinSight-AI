export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>© 2026 FinSight AI. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="/terms" className="hover:text-primary hover:underline">Terms of Service</a>
          <a href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</a>
          <a href="/data-policy" className="hover:text-primary hover:underline">Data Policy</a>
        </div>
      </div>
    </footer>
  );
}