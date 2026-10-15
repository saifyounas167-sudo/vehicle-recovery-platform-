import Link from "next/link";
import {requireRole} from "@/lib/auth";
import DriverReviewList from "./driver-review-list";
export const dynamic="force-dynamic";
export default async function Page(){
 await requireRole("admin");
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Platform operations</p><h1>Driver Approvals</h1></div><Link href="/admin" className="button secondary">Admin dashboard</Link></div></header><section className="container dashboard-content"><DriverReviewList/></section></main>;
}
