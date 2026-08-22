import CreateWizard from "@/components/create/CreateWizard";
import { THEMES } from "@/engine/themes";
import type { ThemeId } from "@/lib/types";

function validTheme(value: string | undefined): ThemeId | null {
  if (!value) return null;
  if (value in THEMES) return value as ThemeId;
  return null;
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const initialTheme = validTheme(params?.template);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-[#2a0e04] via-[#241007] to-[#1a0803] text-[#fff6e9]">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 text-center">
          <p className="text-4xl">🪔</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Create a{" "}
            <span className="bg-gradient-to-r from-[#ffd97a] to-[#ff9d2e] bg-clip-text text-transparent">
              Rakhi Card
            </span>
          </h1>
          <p className="mt-2 text-sm text-[#ffd9a0]/60">
            Craft something as special as your bond — then share it with your sister.
          </p>
        </header>
        <CreateWizard initialTheme={initialTheme} />
      </main>
    </div>
  );
}
