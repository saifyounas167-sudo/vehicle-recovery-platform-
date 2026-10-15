import {createHmac,timingSafeEqual} from "node:crypto";
const cookieName="ukr_guest_booking";
const ttlSeconds=60*60*24;
const secret=()=>{const value=process.env.GUEST_REQUEST_HASH_SECRET;if(!value||value.length<32)throw Error("Guest signing secret missing");return value};
export const bookingCookieName=cookieName;
export function makeBookingCookie(jobId:string,reference:string){
 const expires=Math.floor(Date.now()/1000)+ttlSeconds;
 const payload=[jobId,Buffer.from(reference,"utf8").toString("base64url"),String(expires)].join(".");
 const signature=createHmac("sha256",secret()).update("booking|"+payload).digest("hex");
 return {value:payload+"."+signature,maxAge:ttlSeconds};
}
export function verifyBookingCookie(value:string|undefined){
 if(!value||value.length>700)return null;
 const parts=value.split(".");if(parts.length!==4)return null;
 const [jobId,refEncoded,expiryText,signature]=parts;
 if(!/^[0-9a-f-]{36}$/i.test(jobId)||!/^[a-zA-Z0-9_-]{1,350}$/.test(refEncoded)||!/^[0-9]{10}$/.test(expiryText)||!/^[0-9a-f]{64}$/.test(signature))return null;
 const expires=Number(expiryText),now=Math.floor(Date.now()/1000);
 if(!Number.isSafeInteger(expires)||expires<now||expires>now+ttlSeconds)return null;
 const payload=[jobId,refEncoded,expiryText].join(".");
 const expected=createHmac("sha256",secret()).update("booking|"+payload).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature,"hex")))return null;
 const reference=Buffer.from(refEncoded,"base64url").toString("utf8");
 if(!reference||reference.length>200)return null;
 return {jobId,reference};
}
