import { MainFooter } from "@/components/main-footer";
import { ModHeader } from "@/modules/moderator/components/mod-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    process.env.NODE_ENV === "production"
      ? "Moderator - Zainy Water"
      : "(Dev) Moderator - Zainy Water",
  description: "Moderator layout for Zainy Water",
};

type Props = {
  children: React.ReactNode;
};

const ModLayout = ({ children }: Props) => {
  return (
    <div>
      <ModHeader />
      {children}
      <MainFooter className="w-full bg-primary text-white py-2 text-center md:text-sm text-[10px]" />
    </div>
  );
};
export default ModLayout;
