import RequireAuth from "@/components/require-auth";

export default function Dashboard() {
  return (
    <RequireAuth>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Today</h2>
          <p className="text-sm text-gray-600">Quick stats coming soon.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Patients</h2>
          <p className="text-sm text-gray-600">Add, list, search.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium">Appointments</h2>
          <p className="text-sm text-gray-600">Calendar next.</p>
        </div>
      </div>
    </RequireAuth>
  );
}
