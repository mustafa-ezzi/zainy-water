import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";
import { LoadingDotsBounce } from "@/components/loading-dots";

export default function Page() {
  return (
    <div>
      <ClerkLoading>
        <LoadingDotsBounce />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp />
      </ClerkLoaded>
    </div>
  );
}
