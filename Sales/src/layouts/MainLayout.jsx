import PageHeader from "../components/common/PageHeader";
import ThemeToggle from "../components/common/ThemeToggle";

export default function MainLayout({ children, title, desc }) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="px-6 pt-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <PageHeader title={title} desc={desc} />
        </div>
        <div className="shrink-0 pt-1">
          <ThemeToggle />
        </div>
      </div>

      {/* BODY */}
      <div className="px-6 pb-6">
        {children}
      </div>

    </div>
  );
}