import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-6 text-center">
      <h2 className="font-display mb-2 text-2xl font-bold text-[#E9EFEC]">
        404 — Page Not Found
      </h2>
      <p className="mb-6 text-xs text-[#879490]">
        The requested stairwell terminal route does not exist.
      </p>
      <Link
        href="/dashboard"
        className="font-mono-tech rounded bg-[#00E39D] px-4 py-2 text-xs font-bold text-[#052018]"
      >
        Return to Command Center
      </Link>
    </main>
  );
}
