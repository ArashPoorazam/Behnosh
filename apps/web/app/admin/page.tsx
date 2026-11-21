import "@/styles/admin.css";
import { Dashboard } from "@/components/admin/dashboard";
export const metadata = {
  title: "مدیریت فروشگاه | بهنوش",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <Dashboard />;
}
