import AccountNavigation from "@/app/components/account-navigation";
import {requireRole} from "@/lib/auth";
import {MembershipView} from "./membership-view";
import "./membership.css";

export const dynamic="force-dynamic";

export default async function DriverMembershipPage(){
 await requireRole("driver");
 // Auth stays server-enforced; no Stripe Checkout, billing writes, or schema changes.
 return <MembershipView accountNavigation={<AccountNavigation/>}/>;
}
