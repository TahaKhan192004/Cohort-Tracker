import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="text-xs uppercase tracking-[0.14em] text-terracotta">404</p>
      <h1 className="mt-3 text-3xl">Nothing here</h1>
      <p className="mt-2.5 text-sm text-smoke">
        That page doesn&apos;t exist, or it isn&apos;t yours to see.
      </p>
      <div className="mt-6">
        <ButtonLink href="/">Back to your dashboard</ButtonLink>
      </div>
    </div>
  );
}
