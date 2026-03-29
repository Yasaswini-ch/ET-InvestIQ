import PageHeader from "@/components/PageHeader";
import SIPWhatIfSimulator from "@/components/SIPWhatIfSimulator";

export default function WhatIfPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio What-If Simulator"
        description="Model how shifting capital between two holdings could have changed your portfolio trajectory."
      />
      <SIPWhatIfSimulator />
    </div>
  );
}

