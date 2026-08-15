import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useState } from "react";

export const Route = createFileRoute("/admin/tala/")({
  component: TalaActivityPage,
});

type Tab = "activity" | "messages" | "approvals" | "notifications";

function TalaActivityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  return (
    <AdminLayout>
      <PageHeader
        title="TALA Activity"
        subtitle="Agent operational log, messages, actions, and approval requests"
      />

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">WhatsApp Channel</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">Not connected</p>
          <p className="mt-1 text-sm text-gray-500">
            WhatsApp webhook is not yet configured. TALA cannot send or receive WhatsApp messages until a channel adapter is wired.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">TALA Runtime</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">Standby</p>
          <p className="mt-1 text-sm text-gray-500">
            The agent runtime is prepared but not yet receiving tasks. Model provider and tools will be configured in Settings.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Messages</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">None</p>
          <p className="mt-1 text-sm text-gray-500">
            No messages received yet. Once WhatsApp is connected, inbound and outbound messages will be logged here.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval Requests</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">0</p>
          <p className="mt-1 text-sm text-gray-500">
            No pending approvals. Financial actions prepared by TALA require owner approval before issuance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-4 px-4">
          {(["activity", "messages", "approvals", "notifications"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium border-b-2 pb-3 transition-colors ${
                activeTab === tab
                  ? "border-blue-900 text-blue-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "activity" && (
          <EmptyState
            title="No activity yet"
            description="TALA's actions, tool calls, messages, and notifications will be recorded here for audit and review."
            icon="inbox"
          />
        )}

        {activeTab === "messages" && (
          <EmptyState
            title="No messages yet"
            description="Inbound and outbound messages will appear here once WhatsApp is connected."
            icon="inbox"
          />
        )}

        {activeTab === "approvals" && (
          <EmptyState
            title="No approval requests"
            description="Financial actions prepared by TALA require owner approval. Pending approvals will appear here."
            icon="file"
          />
        )}

        {activeTab === "notifications" && (
          <EmptyState
            title="No notifications"
            description="Alerts and notifications from TALA will appear here."
            icon="alert-circle"
          />
        )}
      </div>
    </AdminLayout>
  );
}
