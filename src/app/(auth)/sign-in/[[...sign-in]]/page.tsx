import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { LoadingDotsBounce } from "@/components/loading-dots";

export default function Page() {
  return (
    <div>
      <ClerkLoading>
        <LoadingDotsBounce />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn />
      </ClerkLoaded>
    </div>
  );
}
