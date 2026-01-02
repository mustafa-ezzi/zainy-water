"use server";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Atom } from "react-loading-indicators";

import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import ErrorState from "@/components/hydration-states/error-state";
import ConnectWhatsapp from "@/modules/admin/whatsapp/connectWhatsapp";

export default async function WhatsappPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center">
      <WelcomeSection
        greeting="Hello 👋"
        text="Connect your WhatsApp account to enable automated messaging."
      />

      <Suspense fallback={<Atom color="#47a1f4" size="medium" />}>
        <ErrorBoundary fallback={<ErrorState />}>
          <ConnectWhatsapp />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
