import ErrorState from "@/components/hydration-states/error-state";
import { orpc } from "@/lib/orpc.server";
import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Atom } from "react-loading-indicators";
import { ChangeLogMainSection } from "@/modules/admin/changelog/ui/changelog-main-section";

const ChangeLog = async () => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      orpc.admin.changelog.getGithubChanges.queryOptions()
    ),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text="Here you can view all the changes made to the application."
        greeting="Fancy here"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
          <ErrorBoundary fallback={<ErrorState />}>
            <ChangeLogMainSection />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};

export default ChangeLog;
