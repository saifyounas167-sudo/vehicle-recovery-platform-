import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {isDashboardPreviewEnabled} from "@/src/lib/dashboard-preview";
import "./preview.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots:{index:false,follow:false},title:"Dashboard Preview | UK Recovery"};
export default function PreviewLayout({children}:{children:React.ReactNode}){
 if(!isDashboardPreviewEnabled())notFound();
 return <>{children}</>;
}
