-- STAGING / isolated development ONLY. NEVER run against Production.
-- Explicitly approved base rates: £5 fixed call-out plus £3 per verified road mile.
-- Unapproved surcharges are disabled at zero, not treated as authorised extras.
-- This is a one-time seed for an EMPTY active pricing setup, NOT an override.
do $$
declare config jsonb := jsonb_build_object(
 'minimumCallout',5.00,'pricePerMile',3.00,
 'vehicleSurcharge',0,'nonRunningSurcharge',0,'lockedWheelSurcharge',0,
 'accidentSurcharge',0,'nightSurcharge',0,'weekendSurcharge',0,
 'bankHolidaySurcharge',0,'urgentSurcharge',0,
 'loadingDifficultySurcharge',0,'specialEquipmentSurcharge',0
);
begin
 if exists(select 1 from public.pricing_rules where active) then
   raise exception 'Existing active pricing rule detected. Review it manually; do not overwrite.';
 end if;
 insert into public.pricing_rules(name,active,rule_config)
 values('Approved initial base pricing - STAGING ONLY',true,config);
end $$;
