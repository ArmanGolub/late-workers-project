import { TopBar } from "@/common/components/TopBar";
import { cn } from "@/common/lib/utils";

type PageProps = {
  className?: string;
  children: React.ReactNode;
};

export const Page = ({ className, children }: PageProps) => (
  <div className="min-h-screen">
    <TopBar />
    <main className={cn("mx-auto max-w-3xl px-4 py-16 sm:py-24", className)}>
      {children}
    </main>
  </div>
);
