import AccessTabs from "@/components/access-tabs";

export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccessTabs />
      {children}
    </>
  );
}
