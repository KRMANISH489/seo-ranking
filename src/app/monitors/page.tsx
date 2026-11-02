import { redirect } from "next/navigation";

export default function MonitorsRedirectPage() {
  redirect("/admin/clients");
}
