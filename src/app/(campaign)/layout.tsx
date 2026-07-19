import { AnalyticsTracker } from "@/components/analytics-tracker";

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AnalyticsTracker />
      {children}
    </div>
  );
}
