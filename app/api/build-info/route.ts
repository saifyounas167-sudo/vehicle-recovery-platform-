import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export function GET(){
 const commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.NEXT_PUBLIC_COMMIT_SHA||null;
 const branch=process.env.VERCEL_GIT_COMMIT_REF||null;
 return NextResponse.json({commit,branch,environment:process.env.VERCEL_ENV||"local"},{headers:{"Cache-Control":"no-store"}});
}
