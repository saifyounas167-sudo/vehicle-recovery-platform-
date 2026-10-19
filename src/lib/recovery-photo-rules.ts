export const MAX_RECOVERY_PHOTOS=3;
export const MAX_RECOVERY_PHOTO_BYTES=5*1024*1024;
export const RECOVERY_PHOTO_TYPES=["image/jpeg","image/png","image/webp"] as const;
export function recoveryPhotosError(files:readonly {size:number;type:string}[]):string|null{
 if(files.length>MAX_RECOVERY_PHOTOS)return "Choose no more than 3 photos.";
 for(const file of files){
  if(!RECOVERY_PHOTO_TYPES.includes(file.type as typeof RECOVERY_PHOTO_TYPES[number]))
   return "Photos must be JPG, PNG or WebP.";
  if(!Number.isFinite(file.size)||file.size<1||file.size>MAX_RECOVERY_PHOTO_BYTES)
   return "Each photo must be 5MB or less.";
 }
 return null;
}
