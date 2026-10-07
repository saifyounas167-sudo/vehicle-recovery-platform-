import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "customer") return NextResponse.json({ error: "Customer account required" }, { status: 403 });

  const body = await request.json();
  if (!body.recoveryType || !body.pickupPostcode) return NextResponse.json({ error: "Recovery service and pickup postcode are required" }, { status: 400 });

  const { data, error } = await supabase.from("recovery_jobs").insert({
    customer_id: user.id,
    recovery_type: body.recoveryType,
    pickup_postcode: body.pickupPostcode,
    destination_postcode: body.destinationPostcode || null,
    vehicle_registration: body.registration || null,
    vehicle_make: body.make || null,
    vehicle_model: body.model || null,
    vehicle_type: body.vehicleType || null,
    transmission: body.transmission || null,
    running_status: body.runningStatus || null,
    problem_description: body.problemDescription || null,
    is_urgent: Boolean(body.urgent),
    preferred_collection_time: body.preferredCollectionTime || null,
    customer_contact_preference: body.contactPreference || null,
    status: "submitted"
  }).select("id,status").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ job: data }, { status: 201 });
}
