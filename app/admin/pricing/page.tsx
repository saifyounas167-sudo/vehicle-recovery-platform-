import Link from "next/link";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import PricingEditor from "./pricing-editor";
import {validPricingConfig} from "@/src/lib/recovery-pricing";
export const dynamic="force-dynamic";
export default async function Page(){
 await requireRole("admin");const db=await createClient();
 const {data:rules,error}=await db.from("pricing_rules").select("id,name,active,rule_config").eq("active",true).limit(2);
 const row=rules?.length===1?rules[0]:null;
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Platform operations</p><h1>Pricing Rules</h1></div><Link href="/admin" className="button secondary">Admin dashboard</Link></div></header><section className="container dashboard-content">{error?<div className="dashboard-card">Pricing database unavailable.</div>:!row?<div className="dashboard-card"><h2>No single active pricing configuration</h2><p>Create and activate exactly one approved pricing_rules row in the test Supabase project before editing. Never use placeholder GBP rates.</p></div>:!validPricingConfig(row.rule_config)?<div className="dashboard-card"><h2>Pricing configuration incomplete</h2><p>Fill all required surcharge keys in the existing active pricing_rules record before estimates can be calculated. No missing values will be treated as zero.</p></div>:<PricingEditor id={row.id} initial={row.rule_config}/>}</section></main>;
}
