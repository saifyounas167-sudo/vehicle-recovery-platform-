import {MembershipView} from "../driver/membership/membership-view";
import "../driver/membership/membership.css";
import {notFound} from "next/navigation";
import {isClientReviewDemo} from "@/src/lib/client-review";
export default function VisualQa(){if(!isClientReviewDemo()||process.env.NODE_ENV!=="production"||process.env.NEXT_PUBLIC_SUPABASE_URL!=="https://example.supabase.co")notFound();return <MembershipView/>}
