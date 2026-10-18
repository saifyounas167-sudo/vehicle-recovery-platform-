-- SS8 client requirements. REVIEW AND TEST ON EXISTING ISOLATED STAGING FIRST.
-- Do NOT run on Production without explicit approval. No data deletion, RLS relaxation,
-- bucket publication, membership activation, or marketplace notifications.
BEGIN;
DO $check$
BEGIN
 IF to_regclass('public.driver_profiles') IS NULL OR
    to_regclass('public.driver_verification_documents') IS NULL OR
    to_regclass('public.profiles') IS NULL THEN
   RAISE EXCEPTION 'Missing existing SS8 foundation tables';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='driver-verification-private' AND public=false) THEN
   RAISE EXCEPTION 'Private driver verification bucket absent or public';
 END IF;
 IF EXISTS (SELECT 1 FROM public.driver_verification_documents
            WHERE document_type NOT IN ('insurance','driving_licence','business','other',
                                        'valid_id','profile_photo','truck_photo')) THEN
   RAISE EXCEPTION 'Unrecognised existing document types; do not overwrite constraints';
 END IF;
END $check$;
ALTER TABLE public.driver_profiles
 ADD COLUMN IF NOT EXISTS recovery_truck_details text,
 ADD COLUMN IF NOT EXISTS vehicle_registration_details text,
 ADD COLUMN IF NOT EXISTS operating_areas text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.driver_profiles
 DROP CONSTRAINT IF EXISTS driver_truck_details_length;
ALTER TABLE public.driver_profiles
 ADD CONSTRAINT driver_truck_details_length CHECK
  (recovery_truck_details IS NULL OR char_length(recovery_truck_details)<=1000);
ALTER TABLE public.driver_profiles
 DROP CONSTRAINT IF EXISTS driver_vehicle_registration_details_length;
ALTER TABLE public.driver_profiles
 ADD CONSTRAINT driver_vehicle_registration_details_length CHECK
  (vehicle_registration_details IS NULL OR char_length(vehicle_registration_details)<=150);
ALTER TABLE public.driver_profiles
 DROP CONSTRAINT IF EXISTS driver_operating_areas_count;
ALTER TABLE public.driver_profiles
 ADD CONSTRAINT driver_operating_areas_count CHECK (cardinality(operating_areas)<=30);
ALTER TABLE public.driver_verification_documents
 DROP CONSTRAINT IF EXISTS driver_verification_documents_document_type_check;
ALTER TABLE public.driver_verification_documents
 ADD CONSTRAINT driver_verification_documents_document_type_check
 CHECK(document_type IN ('insurance','valid_id','profile_photo','truck_photo',
                         'driving_licence','business','other'));
-- Historical documents remain stored; legacy types are accepted in DB for compatibility.
-- Browser uploads only use client-required insurance, valid ID, profile and truck photos.
-- Existing RLS + approval guards remain unchanged.
COMMIT;

-- READ-ONLY STAGING VERIFICATION
-- SELECT column_name,udt_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='driver_profiles'
-- AND column_name IN ('business_address','company_registration_number',
--  'experience_years','recovery_truck_details','vehicle_registration_details',
--  'operating_areas');
-- SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid='public.driver_verification_documents'::regclass;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname IN
-- ('driver_profiles','driver_verification_documents');
-- SELECT id,public FROM storage.buckets WHERE id='driver-verification-private';
-- SELECT tgname,tgenabled FROM pg_trigger WHERE
-- tgrelid='public.driver_profiles'::regclass AND NOT tgisinternal;
-- Rollback: DO NOT automatically drop added columns or revert constraint.
-- This could delete newly collected driver information; restore only via a
-- separately reviewed, backup-backed migration if rollback becomes necessary.
