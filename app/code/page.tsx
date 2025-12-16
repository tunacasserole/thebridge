'use client';

import CodePanel from '@/components/CodePanel';

/**
 * Code page - Full-page code editor with local bridge integration
 */
export default function CodePage() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[--text-primary]">Code Editor</h1>
        <p className="text-sm text-[--text-secondary]">
          Edit local files and run Claude Code directly from TheBridge
        </p>
      </div>
      <CodePanel className="flex-1" />
    </main>
  );
}
