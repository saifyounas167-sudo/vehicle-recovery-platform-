import Link from "next/link";
import type {ReactNode} from "react";
import AccountNavigation from "../components/account-navigation";
import CustomerIcon,{type CustomerIconName} from "./customer-icons";
import CustomerLogout from "./customer-logout";
import "./customer-dashboard.css";
type Nav={label:string;href:string;icon:CustomerIconName;key:string};
const links:Nav[]=[
 {key:"home",label:"Overview",href:"/customer",icon:"home"},
 {key:"requests",label:"My Recovery Requests",href:"/customer#requests",icon:"requests"},
 {key:"offers",label:"Driver Offers",href:"/customer#offers",icon:"offers"},
 {key:"bookings",label:"Active Bookings",href:"/customer#bookings",icon:"bookings"},
 {key:"tracking",label:"Track My Recovery",href:"/customer#tracking",icon:"tracking"},
 {key:"history",label:"Booking History",href:"/customer#history",icon:"history"},
 {key:"account",label:"My Profile / Settings",href:"/customer/account",icon:"account"}
];
export default function CustomerFrame({children,active="home"}:{children:ReactNode;active?:"home"|"account"}){
 return <div className="customer-app">
  <a href="#customer-main" className="customer-skip-link">Skip to main content</a>
  <header className="customer-app-header">
   <div className="customer-header-inner">
    <Link href="/" className="customer-brand" aria-label="UK Recovery Homepage"><span className="customer-brand-icon">UK</span><span>UK <strong>RECOVERY</strong></span></Link>
    <span className="customer-portal-title">CUSTOMER PORTAL</span>
    <div className="customer-header-account"><span className="customer-secure-label"><CustomerIcon name="shield" size={15}/> Secure account</span><AccountNavigation/></div>
   </div>
  </header>
  <div className="customer-app-layout">
   <aside className="customer-sidebar" aria-label="Customer dashboard navigation">
    <div className="customer-sidebar-label">MY ACCOUNT</div>
    <nav className="customer-side-links" aria-label="Customer menu">
     {links.map(link=><Link href={link.href} key={link.key} className={"customer-side-link"+(active===link.key?" is-active":"")} aria-current={active===link.key?"page":undefined}>
       <CustomerIcon name={link.icon}/><span>{link.label}</span>
     </Link>)}
    </nav>
    <div className="customer-sidebar-footer"><CustomerLogout/><p>Your recovery, your choice.</p></div>
   </aside>
   <main id="customer-main" className="customer-main">{children}</main>
  </div>
 </div>;
}
