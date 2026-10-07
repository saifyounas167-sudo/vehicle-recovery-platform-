import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/src/types/domain";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("id,role,full_name,email").eq("id", userId).maybeSingle();
  return { user: { id: userId }, profile: profile as { id: string; role: UserRole; full_name: string | null; email: string | null } | null };
}

export async function requireRole(role: UserRole) {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) redirect("/login?reason=auth");
  if (profile.role !== role) redirect("/403");
  return { user, profile };
}
