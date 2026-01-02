import { WelcomeSection } from "@/modules/admin/components/welcome-section";
import { AddModMainSection } from "../../../../../modules/admin/add-moderator/ui/add-mod-main-section";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

const AddModeratorPage = () => {
  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text="Here you can manage moderators for your platform. You can add, edit, and
        remove moderators as needed."
      />

      <AddModMainSection />
    </div>
  );
};
export default AddModeratorPage;
