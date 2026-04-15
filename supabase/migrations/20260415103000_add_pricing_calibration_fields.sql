alter table public.artist_pricing_rules
add column if not exists anchor_price integer,
add column if not exists calibration_examples jsonb not null default '{}'::jsonb,
add column if not exists calibration_reference_slots jsonb not null default '[]'::jsonb;

update public.artist_pricing_rules
set
  anchor_price = coalesce(anchor_price, base_price, minimum_charge, minimum_session_price, 2400),
  calibration_examples = case
    when calibration_examples <> '{}'::jsonb then calibration_examples
    else jsonb_build_object(
      'size',
      jsonb_build_object(
        'tiny', greatest(round(coalesce(anchor_price, base_price, 2400) * 0.5), 0),
        'small', greatest(round(coalesce(anchor_price, base_price, 2400) * 0.75), 0),
        'medium', greatest(round(coalesce(anchor_price, base_price, 2400) * 1.1), 0),
        'large', greatest(round(coalesce(anchor_price, base_price, 2400) * 2.1), 0)
      ),
      'detailLevel',
      jsonb_build_object(
        'simple', greatest(round(coalesce(anchor_price, base_price, 2400) * 0.92), 0),
        'standard', greatest(round(coalesce(anchor_price, base_price, 2400) * 1.06), 0),
        'detailed', greatest(round(coalesce(anchor_price, base_price, 2400) * 1.2), 0)
      ),
      'placement',
      coalesce(
        (
          select jsonb_object_agg(key, round(coalesce(anchor_price, base_price, 2400) * (value::numeric)))
          from jsonb_each_text(coalesce(placement_multipliers, '{}'::jsonb)) as t(key, value)
        ),
        '{}'::jsonb
      ),
      'colorMode',
      jsonb_build_object(
        'black-only', greatest(round(coalesce(anchor_price, base_price, 2400) * 0.97), 0),
        'black-grey', greatest(round(coalesce(anchor_price, base_price, 2400) * 1.04), 0),
        'full-color', greatest(round(coalesce(anchor_price, base_price, 2400) * 1.22), 0)
      )
    )
  end,
  calibration_reference_slots = case
    when jsonb_array_length(calibration_reference_slots) > 0 then calibration_reference_slots
    else '[
      {"slotId":"size-tiny","axis":"size","key":"tiny","label":"Size · tiny","assetRef":null},
      {"slotId":"size-small","axis":"size","key":"small","label":"Size · small","assetRef":null},
      {"slotId":"size-medium","axis":"size","key":"medium","label":"Size · medium","assetRef":null},
      {"slotId":"size-large","axis":"size","key":"large","label":"Size · large","assetRef":null},
      {"slotId":"detail-simple","axis":"detailLevel","key":"simple","label":"Detail · simple","assetRef":null},
      {"slotId":"detail-standard","axis":"detailLevel","key":"standard","label":"Detail · standard","assetRef":null},
      {"slotId":"detail-detailed","axis":"detailLevel","key":"detailed","label":"Detail · detailed","assetRef":null},
      {"slotId":"color-black-only","axis":"colorMode","key":"black-only","label":"Color · black-only","assetRef":null},
      {"slotId":"color-black-grey","axis":"colorMode","key":"black-grey","label":"Color · black-grey","assetRef":null},
      {"slotId":"color-full-color","axis":"colorMode","key":"full-color","label":"Color · full-color","assetRef":null}
    ]'::jsonb
  end
where true;
