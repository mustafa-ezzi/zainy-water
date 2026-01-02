import ChatBotMainSection from "@/modules/admin/chat-bot/ui/chat-bot-main-section";
import { WelcomeSection } from "@/modules/admin/components/welcome-section";

const AdminPage = async () => {
  // if (!(process.env.NODE_ENV === "development")) {
  //   return <div>This page is currently under-development.</div>;
  // }

  return (
    <div className="w-full min-h-screen flex flex-col justify-start items-center">
      <WelcomeSection
        text={
          "Welcome to the GEKKO AI. A one-stop solution for all your queries."
        }
        greeting="What's up"
      />
      <ChatBotMainSection />
    </div>
  );
};
export default AdminPage;
