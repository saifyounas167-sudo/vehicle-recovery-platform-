-- READ-ONLY verification. Run ONLY in vehicle-recovery-test SQL Editor.
-- This does NOT add, activate, or overwrite any pricing rule.
with active as (
 select id,name,rule_config
 from public.pricing_rules
 where active is true
), checked as (
 select id,name,rule_config,
  (select count(*) from active) as active_count,
  coalesce((rule_config->>'minimumCallout')::numeric = 50,false) as minimum_ok,
  coalesce((rule_config->>'pricePerMile')::numeric = 2,false) as per_mile_ok,
  coalesce((rule_config->>'nonRunningSurcharge')::numeric = 20,false) as nonrunning_ok,
  coalesce((rule_config->>'nightSurcharge')::numeric = 15,false) as night_ok,
  coalesce((rule_config->>'vehicleSurcharge')::numeric = 0,false) as vehicle_ok,
  coalesce((rule_config->>'lockedWheelSurcharge')::numeric = 0,false) as locked_wheel_ok,
  coalesce((rule_config->>'accidentSurcharge')::numeric = 0,false) as accident_ok,
  coalesce((rule_config->>'weekendSurcharge')::numeric = 0,false) as weekend_ok,
  coalesce((rule_config->>'bankHolidaySurcharge')::numeric = 0,false) as holiday_ok,
  coalesce((rule_config->>'urgentSurcharge')::numeric = 0,false) as urgent_ok,
  coalesce((rule_config->>'loadingDifficultySurcharge')::numeric = 0,false) as loading_ok,
  coalesce((rule_config->>'specialEquipmentSurcharge')::numeric = 0,false) as equipment_ok
 from active
)
select id,name,active_count,minimum_ok,per_mile_ok,nonrunning_ok,night_ok,
 vehicle_ok,locked_wheel_ok,accident_ok,weekend_ok,holiday_ok,urgent_ok,loading_ok,equipment_ok
from checked;
-- Zero rows => no active config; >1 => multiple active rules.
-- An existing active rule was deliberately not overwritten by the temporary seed.
