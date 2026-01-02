import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import { OtherExpenseMainSection } from "../../../../../modules/admin/other-expenses/ui/other-exp-main-section";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import ErrorState from "@/components/hydration-states/error-state";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { Atom } from "react-loading-indicators";
import { orpc } from "@/lib/orpc.server";

export default async function OtherExpensePage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(orpc.util.get30dOtherExpenses.queryOptions()),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text={"Here you can manage extra expenses for your business."}
        greeting="Hi there"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
          <ErrorBoundary fallback={<ErrorState />}>
            <OtherExpenseMainSection />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
