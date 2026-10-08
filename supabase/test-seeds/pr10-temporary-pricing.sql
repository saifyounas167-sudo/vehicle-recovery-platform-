-- TEMPORARY Preview/test-only recovery pricing seed.
-- NEVER apply to production. Existing active rules are not overwritten.
-- Values are editable in /admin/pricing after application.
do $$
declare config jsonb := jsonb_build_object(
 'minimumCallout',50,'pricePerMile',2,'nonRunningSurcharge',20,'nightSurcharge',15,
 'vehicleSurcharge',0,'lockedWheelSurcharge',0,'accidentSurcharge',0,
 'weekendSurcharge',0,'bankHolidaySurcharge',0,'urgentSurcharge',0,
 'loadingDifficultySurcharge',0,'specialEquipmentSurcharge',0
);
begin
 if not exists(select 1 from public.pricing_rules where active) then
   insert into public.pricing_rules(name,active,rule_config)
   values('TEMP Preview testing rates — replace before launch',true,config);
 end if;
end $$;
