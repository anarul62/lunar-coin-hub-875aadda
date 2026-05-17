import AdminLayout from "@/components/admin/AdminLayout";
import { Construction } from "lucide-react";

const AdminPlaceholder = ({ title }: { title: string }) => (
  <AdminLayout title={title}>
    <div className="bg-white rounded-xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center">
      <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
        <Construction className="h-7 w-7"/>
      </div>
      <h2 className="font-semibold text-slate-900 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md">This section is ready to configure. Tell me what fields and actions you need here and I'll wire it up.</p>
    </div>
  </AdminLayout>
);

export default AdminPlaceholder;
