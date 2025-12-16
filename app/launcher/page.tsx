'use client';

import { IntegrationLauncher } from '@/components/launcher';

export default function LauncherPage() {
  const handleSelect = (id: string) => {
    console.log('Selected integration:', id);
    // Handle navigation or panel opening here
  };

  return (
    <IntegrationLauncher
      onSelect={handleSelect}
      layout="grid"
      size="md"
      animated={true}
      title="Choose Your Integration"
      subtitle="Select a service to connect and manage from TheBridge"
    />
  );
}
