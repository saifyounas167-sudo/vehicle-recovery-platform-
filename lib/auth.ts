import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/src/types/domain";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as { id: string; role: UserRole; full_name: string | null; email: string | null } | null };
}

export async function requireRole(role: UserRole) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) redirect("/login?reason=auth");
  if (profile.role !== role) redirect("/403");

  return { user, profile };
}
