import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { UserRole } from "@/src/types/domain";

export async function getCurrentProfile() {
  if (!getSupabaseEnv()) return { user: null, profile: null };
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return { user: null, profile: null };

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("id,role,full_name,email").eq("id", userId).maybeSingle();
    if (profileError) throw profileError;
    return { user: { id: userId }, profile: profile as { id:string; role:UserRole; full_name:string|null; email:string|null } | null };
  } catch (error) {
    console.error("Auth profile lookup failed", error);
    return { user: null, profile: null };
  }
}

export async function requireRole(role: UserRole) {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) redirect("/login?reason=auth");
  if (profile.role !== role) redirect("/403");
  return { user, profile };
}
