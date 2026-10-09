import type {Metadata} from "next";
import Link from "next/link";
import PublicHeader from "../components/public-header";
import "./how-it-works.css";

export const metadata:Metadata={
 title:"How UK Recovery Works | Customer & Recovery Driver Guide",
 description:"Explore how customers request vehicle recovery, compare independent recovery driver offers and choose who to work with. See our recovery company journey and current availability.",
 openGraph:{
  title:"How It Works | UK Recovery",
  description:"A clearer way to request vehicle recovery and choose your recovery professional. Discover the customer and driver journeys."
 }
};

const customerSteps=[
 {n:"01",icon:"pin",title:"Tell us where you need help",
  text:"Enter your pickup postcode and where the vehicle needs to go. You can also use your device's GPS to help identify a nearby postcode.",
  note:"Confirm the exact street address before requesting recovery",tag:"Location"},
 {n:"02",icon:"car",title:"Describe your vehicle & service",
  text:"Add the registration (if known), vehicle condition, chosen recovery service and a description of the problem.",
  note:"Choose from 10 recovery services",tag:"Vehicle details"},
 {n:"03",icon:"route",title:"Review a road-based estimate",
  text:"When the route and approved admin pricing rules are available, the system can estimate cost using verified driving miles and relevant surcharges.",
  note:"If unavailable, the price remains to be confirmed",tag:"Estimate"},
 {n:"04",icon:"message",title:"Receive independent driver offers",
  text:"In the planned live marketplace, suitable nearby approved recovery professionals can offer their own price, arrival estimate and optional message.",
  note:"Offers are not guaranteed",tag:"Driver offers"},
 {n:"05",icon:"compare",title:"Compare. Decide. Choose.",
  text:"Review the available offers and choose your preferred company based on price, ETA and verification details. Your choice is never automatically decided by the cheapest offer.",
  note:"You select the company yourself",tag:"Your decision"},
 {n:"06",icon:"truck",title:"Recovery & direct payment",
  text:"The selected recovery company carries out the job. In Phase 1, you pay the driver or company directly—not through this website.",
  note:"Online customer checkout is not part of Phase 1",tag:"Completion"}
] as const;

const driverSteps=[
 {n:"01",icon:"user",title:"Join the marketplace",text:"Register as an independent recovery driver or a recovery company."},
 {n:"02",icon:"clipboard",title:"Build your professional profile",text:"Add your coverage radius, available services, recovery trucks and required business documents."},
 {n:"03",icon:"shield",title:"Verification & membership",text:"Complete approval checks and maintain an active membership to become eligible for offers."},
 {n:"04",icon:"radar",title:"See suitable opportunities",text:"Once the marketplace is live, review nearby requests matching your coverage and services."},
 {n:"05",icon:"send",title:"Send your own offer",text:"Enter your proposed price, ETA and an optional message. The customer chooses whether to accept."},
 {n:"06",icon:"chart",title:"Manage your recovery work",text:"Follow accepted jobs, completed recoveries and the activity of your recovery business."}
] as const;

const benefits=[
 {icon:"compare",title:"Choice stays with you",text:"Drivers offer independently. Customers decide which recovery professional best suits their situation."},
 {icon:"route",title:"Distance explained",text:"Where available, driving distance—not a straight-line guess—forms part of the estimated price."},
 {icon:"shield",title:"Verification built in",text:"Approval and membership checks are required before a recovery professional can offer on live jobs."},
 {icon:"wallet",title:"Direct Phase 1 payment",text:"The customer pays the chosen company directly. The platform does not process recovery job payments in Phase 1."}
] as const;

const questions=[
 {q:"Can I book a recovery on this website right now?",a:"Not yet. You can explore the five-step request form and available route preview, but real requests and driver offers are temporarily disabled while testing is completed."},
 {q:"Will the estimated price be the final amount?",a:"No. An estimate can be shown when verified road mileage and approved pricing rules are available. A recovery professional may quote a different price, and the customer chooses whether to accept their offer. Unapproved prices are not displayed."},
 {q:"How does the website calculate road distance?",a:"The planned pricing flow checks UK postcodes and uses a road-routing provider such as OpenRouteService to calculate driving miles. If route data is unavailable, the website does not invent distance or a price."},
 {q:"Does the website automatically choose the cheapest driver?",a:"No. Suitable approved recovery companies may submit offers with price and ETA. The customer reviews the available offers and manually chooses their preferred company."},
 {q:"How do customers pay for recovery?",a:"In Phase 1, customers pay the selected recovery driver or company directly. Online customer recovery payments are not enabled on the website."},
 {q:"Can any driver send an offer?",a:"No. Live offer eligibility requires driver approval, appropriate services and coverage, and an active membership. These checks remain part of the integrated system; live offers are not yet available."},
 {q:"Is the driver subscription payment system live?",a:"No. Driver memberships form part of the intended business model, but the online subscription payment integration is planned and will not be advertised as live until verified."},
 {q:"Is live tracking, SMS or instant arrival guaranteed?",a:"No. Live GPS tracking, SMS and other operational notifications are not being presented as active or guaranteed features at this time."}
] as const;

type GlyphName="pin"|"car"|"route"|"message"|"compare"|"truck"|"user"|"clipboard"|"shield"|"radar"|"send"|"chart"|"wallet"|"arrow"|"check"|"spark"|"clock";
const paths:Record<GlyphName,string>={
 pin:"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
 car:"M5 17h14l-1.5-7h-11L5 17ZM7 10l2-4h6l2 4M5 17v2m14-2v2M4 13H2m18 0h2",
 route:"M4 19h3a4 4 0 0 0 4-4V9a4 4 0 0 1 4-4h5M17 2l3 3-3 3M4 15v4M20 12v7",
 message:"M4 5h16v12H9l-5 4V5ZM8 10h8M8 13h5",
 compare:"M5 4h14v16H5V4ZM12 4v16M8 9h1M15 9h1M8 14h1M15 14h1",
 truck:"M3 7h11v11H3V7ZM14 11h4l3 3v4h-7v-7ZM8 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
 user:"M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 21v-2a8 8 0 0 1 16 0v2",
 clipboard:"M8 4H5v17h14V4h-3M9 3h6v4H9V3ZM8 12h8M8 16h6",
 shield:"M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4ZM9 12l2 2 4-4",
 radar:"M12 12l6-6M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5",
 send:"M3 11 21 3l-5 18-4-8-9-2ZM12 13l9-10",
 chart:"M4 20V4M4 20h17M8 16l4-5 3 2 5-7",
 wallet:"M3 6h17v14H3V6ZM3 10h19v7h-8a3 3 0 0 1 0-6h8M16 14h1",
 arrow:"M4 12h16M14 6l6 6-6 6",
 check:"M4 12l5 5L20 6",
 spark:"M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z",
 clock:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2"
};
function Glyph({name,size=22}:{name:GlyphName;size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
function SectionEyebrow({children,light=false}:{children:React.ReactNode;light?:boolean}){
 return <span className={light?"hiw-eyebrow hiw-eyebrow--light":"hiw-eyebrow"}><i aria-hidden="true"/>{children}</span>;
}

function RouteIllustration(){
 return <div className="hiw-map-visual" aria-label="Illustrative UK recovery route diagram, not live tracking">
  <div className="hiw-map-grid" aria-hidden="true"/>
  <div className="hiw-map-street hiw-map-street--a" aria-hidden="true"/>
  <div className="hiw-map-street hiw-map-street--b" aria-hidden="true"/>
  <div className="hiw-map-street hiw-map-street--c" aria-hidden="true"/>
  <span className="hiw-map-tag">ILLUSTRATIVE ROUTE VIEW</span>
  <svg className="hiw-route-drawing" viewBox="0 0 500 310" aria-hidden="true">
   <path d="M63 226 C108 217 116 166 162 172 S222 216 252 162 344 83 429 84"
    fill="none" stroke="#ff6600" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 11"/>
   <circle cx="63" cy="226" r="16" fill="#fff" stroke="#ff6600" strokeWidth="5"/>
   <circle cx="429" cy="84" r="16" fill="#ff6600" stroke="#fff" strokeWidth="5"/>
  </svg>
  <div className="hiw-map-point hiw-map-point--pickup"><span className="hiw-map-dot"/><div><small>YOUR PICKUP</small><strong>UK postcode</strong></div></div>
  <div className="hiw-map-point hiw-map-point--destination"><span className="hiw-map-dot hiw-map-dot--end"/><div><small>DESTINATION</small><strong>Chosen location</strong></div></div>
  <div className="hiw-map-caption"><Glyph name="route" size={19}/><span>Actual miles depend on verified driving directions</span></div>
 </div>;
}

export default function HowItWorksPage(){
 return <>
  <PublicHeader/>
  <main className="hiw" id="how-it-works">
   <section className="hiw-hero" aria-labelledby="hiw-title">
    <div className="hiw-hero-overlay" aria-hidden="true"/>
    <div className="hiw-wrap hiw-hero-grid">
     <div className="hiw-hero-content">
      <span className="hiw-hero-status"><span className="hiw-status-dot"/> UK RECOVERY · HOW IT WORKS</span>
      <h1 id="hiw-title">Recovery, with <em>clarity</em> at every turn.</h1>
      <p>One clear journey from your first postcode to choosing the recovery professional that works for you. Built around transparent offers, not automatic decisions.</p>
      <div className="hiw-hero-actions">
       <Link className="hiw-btn hiw-btn--orange" href="/recovery/request">Explore the recovery form <Glyph name="arrow" size={19}/></Link>
       <a className="hiw-btn hiw-btn--outline" href="#for-drivers">I'm a recovery professional <Glyph name="arrow" size={18}/></a>
      </div>
      <p className="hiw-hero-disclaimer"><Glyph name="shield" size={16}/> This is a design preview. Live bookings, offers and online payments are paused.</p>
     </div>
     <div className="hiw-hero-card" aria-label="Illustration of the customer choice process">
      <div className="hiw-hero-card-head"><span className="hiw-window-dots" aria-hidden="true"><i/><i/><i/></span><span>THE RECOVERY JOURNEY</span><span className="hiw-card-preview">PREVIEW</span></div>
      <div className="hiw-hero-route">
       <span className="hiw-hero-location"><span className="hiw-mini-pin hiw-mini-pin--a"/><span><small>Start</small><strong>Pickup postcode</strong></span></span>
       <span className="hiw-hero-route-line" aria-hidden="true"/>
       <span className="hiw-hero-location"><span className="hiw-mini-pin hiw-mini-pin--b"/><span><small>Finish</small><strong>Your destination</strong></span></span>
      </div>
      <div className="hiw-hero-card-divider"/>
      <div className="hiw-offers-head"><strong>Offers, not assignments</strong><span>How selection works</span></div>
      <div className="hiw-hero-offer"><span className="hiw-avatar"><Glyph name="truck" size={20}/></span><span><strong>Recovery company</strong><small>Independent price & arrival estimate</small></span><span className="hiw-offer-mark">COMPARE</span></div>
      <div className="hiw-hero-offer"><span className="hiw-avatar hiw-avatar--grey"><Glyph name="truck" size={20}/></span><span><strong>Another eligible offer</strong><small>Review the details before you decide</small></span><span className="hiw-offer-mark">CHOOSE</span></div>
      <div className="hiw-hero-card-bottom"><Glyph name="check" size={17}/> The customer makes the final choice.</div>
     </div>
    </div>
    <div className="hiw-hero-edge" aria-hidden="true"/>
   </section>

   <nav className="hiw-tabs" aria-label="Jump to a journey">
    <div className="hiw-wrap hiw-tabs-inner">
     <span className="hiw-tabs-caption">DISCOVER THE PROCESS</span>
     <div className="hiw-tabs-links">
      <a href="#for-customers"><Glyph name="user" size={18}/> For customers <span aria-hidden="true">↗</span></a>
      <a href="#for-drivers"><Glyph name="truck" size={19}/> For drivers & companies <span aria-hidden="true">↗</span></a>
      <a href="#common-questions"><Glyph name="message" size={18}/> FAQs <span aria-hidden="true">↗</span></a>
     </div>
    </div>
   </nav>

   <section className="hiw-section hiw-customer" id="for-customers" aria-labelledby="customer-title">
    <div className="hiw-wrap">
     <div className="hiw-section-intro hiw-section-intro--split">
      <div><SectionEyebrow>THE CUSTOMER JOURNEY</SectionEyebrow><h2 id="customer-title">Six clear steps. <span>One decision that's yours.</span></h2></div>
      <p>From roadside details to independent recovery offers, the planned marketplace puts the right information in front of you—without choosing a company on your behalf.</p>
     </div>
     <div className="hiw-timeline">
      {customerSteps.map((step,i)=><article key={step.n} className="hiw-step">
       <div className="hiw-step-top"><span className="hiw-step-index">{step.n}</span><span className="hiw-step-track" aria-hidden="true"/><span className="hiw-step-icon"><Glyph name={step.icon} size={25}/></span></div>
       <div className="hiw-step-body"><span className="hiw-step-tag">{step.tag}</span><h3>{step.title}</h3><p>{step.text}</p></div>
       <div className="hiw-step-foot"><Glyph name="check" size={15}/><span>{step.note}</span></div>
       {i===5&&<span className="hiw-step-finish" aria-label="Final step">THE RECOVERY JOURNEY</span>}
      </article>)}
     </div>
     <div className="hiw-process-note"><span className="hiw-note-symbol"><Glyph name="shield" size={24}/></span><p><strong>Live requests are not yet available.</strong> You can explore our real five-step form design and route interface. Live submissions, driver offers and recovery transactions remain paused until verified.</p><Link href="/recovery/request">View the form <Glyph name="arrow" size={16}/></Link></div>
    </div>
   </section>

   <section className="hiw-section hiw-pricing" id="pricing-explained" aria-labelledby="pricing-title">
    <div className="hiw-wrap hiw-pricing-grid">
     <div className="hiw-pricing-copy">
      <SectionEyebrow>TRANSPARENCY FIRST</SectionEyebrow>
      <h2 id="pricing-title">An estimate that follows the <span>road, not a guess.</span></h2>
      <p>When routing is available, UK postcodes are resolved to approximate locations and a road-routing service calculates the driving miles.</p>
      <div className="hiw-pricing-points">
       <div><span><Glyph name="route" size={21}/></span><p><strong>Verified driving mileage</strong><small>Distance comes from the road route, not a straight line between locations.</small></p></div>
       <div><span><Glyph name="clipboard" size={21}/></span><p><strong>Admin-controlled rates</strong><small>Base charge, mileage rate and applicable vehicle, urgency or time-related surcharges are configurable.</small></p></div>
       <div><span><Glyph name="wallet" size={21}/></span><p><strong>No invented price</strong><small>Without verified mileage and approved rates, the estimate is pending. Driver offers remain their own prices.</small></p></div>
      </div>
      <Link href="/recovery/request" className="hiw-inline-link">See the route and estimate interface <Glyph name="arrow" size={18}/></Link>
     </div>
     <div className="hiw-pricing-art">
      <RouteIllustration/>
      <div className="hiw-price-ticket">
       <div className="hiw-price-ticket-top"><div><span>RECOVERY ESTIMATE</span><strong>Clear inputs. No surprises.</strong></div><Glyph name="spark" size={23}/></div>
       <div className="hiw-price-row"><span>Road mileage</span><strong>Calculated when verified</strong></div>
       <div className="hiw-price-row"><span>Admin pricing</span><strong>Approved rates required</strong></div>
       <div className="hiw-price-total"><span>Estimated recovery price</span><strong>Pending confirmation</strong></div>
       <small>No real-time route or customer quote is being represented by this illustration.</small>
      </div>
     </div>
    </div>
   </section>

   <section className="hiw-section hiw-driver" id="for-drivers" aria-labelledby="driver-title">
    <div className="hiw-driver-orb" aria-hidden="true"/>
    <div className="hiw-wrap">
     <div className="hiw-section-intro hiw-driver-intro">
      <div><SectionEyebrow light>FOR RECOVERY PROFESSIONALS</SectionEyebrow><h2 id="driver-title">Your truck. Your business. <span>A clearer way to find opportunities.</span></h2></div>
      <p>A marketplace designed for independent drivers and recovery companies to present their services, receive relevant opportunities and put forward their own offers.</p>
     </div>
     <div className="hiw-driver-list">
      {driverSteps.map((step)=><article key={step.n} className="hiw-driver-step">
       <div className="hiw-driver-step-head"><span className="hiw-driver-number">{step.n}</span><span className="hiw-driver-icon"><Glyph name={step.icon} size={24}/></span></div>
       <h3>{step.title}</h3><p>{step.text}</p>
      </article>)}
     </div>
     <div className="hiw-driver-bottom"><p><Glyph name="shield" size={19}/> Driver verification and an active membership are requirements for eligible offers. <strong>Online driver subscription payments are planned, not live.</strong></p><Link href="/driver/register" className="hiw-btn hiw-btn--orange">Explore driver registration <Glyph name="arrow" size={18}/></Link></div>
    </div>
   </section>

   <section className="hiw-section hiw-benefits" aria-labelledby="benefits-title">
    <div className="hiw-wrap">
     <div className="hiw-center-intro"><SectionEyebrow>WHY THIS MARKETPLACE?</SectionEyebrow><h2 id="benefits-title">Built around <span>information, trust and choice.</span></h2><p>A recovery marketplace works best when each side can make informed decisions. Here's what the platform is designed to prioritise.</p></div>
     <div className="hiw-benefits-grid">
      {benefits.map(item=><article className="hiw-benefit" key={item.title}><span className="hiw-benefit-icon"><Glyph name={item.icon} size={27}/></span><h3>{item.title}</h3><p>{item.text}</p></article>)}
     </div>
     <div className="hiw-safety-ribbon"><Glyph name="shield" size={25}/><p><strong>Safety by design.</strong> The integrated marketplace includes approval checks, role-based access and offer restrictions. These safeguards must pass live end-to-end testing before real recovery transactions are enabled.</p><span>VERIFICATION REQUIRED</span></div>
    </div>
   </section>

   <section className="hiw-section hiw-faq" id="common-questions" aria-labelledby="faq-title">
    <div className="hiw-wrap hiw-faq-grid">
     <div className="hiw-faq-lead"><SectionEyebrow>GOOD QUESTIONS, CLEAR ANSWERS</SectionEyebrow><h2 id="faq-title">Everything you need to <span>know before you start.</span></h2><p>Understand what the UK Recovery marketplace is designed to do—and what is currently available on the website.</p><div className="hiw-faq-lead-mark"><Glyph name="message" size={29}/><span>Clarity at every step</span></div></div>
     <div className="hiw-faq-list">
      {questions.map((item,i)=><details key={item.q} className="hiw-faq-item" open={i===0?true:undefined}><summary><span>{item.q}</span><span className="hiw-faq-toggle" aria-hidden="true">+</span></summary><div className="hiw-faq-answer"><p>{item.a}</p></div></details>)}
     </div>
    </div>
   </section>

   <section className="hiw-final" aria-labelledby="final-title">
    <div className="hiw-wrap hiw-final-inner"><span className="hiw-final-orbit" aria-hidden="true"/>
     <div><SectionEyebrow light>THE NEXT STEP IS YOURS</SectionEyebrow><h2 id="final-title">Wherever the journey starts, <em>make it a clearer one.</em></h2><p>Explore the customer request experience or see how recovery companies will take part in the marketplace.</p><small>Real bookings, driver offers and subscription payments are not yet available.</small></div>
     <div className="hiw-final-actions"><Link href="/recovery/request" className="hiw-btn hiw-btn--orange">Get a Recovery Quote <Glyph name="arrow" size={20}/></Link><Link href="/driver/register" className="hiw-btn hiw-btn--light">Join as a Recovery Driver <Glyph name="arrow" size={19}/></Link></div>
    </div>
   </section>
   <footer className="hiw-footer"><div className="hiw-wrap"><span><strong>UK</strong> RECOVERY</span><p>Independent recovery professionals. Customer choice. Recovery made clear.</p><Link href="/">Back to home <Glyph name="arrow" size={15}/></Link></div></footer>
  </main>
 </>;
}
