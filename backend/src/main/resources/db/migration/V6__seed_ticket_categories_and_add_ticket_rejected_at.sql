alter table tickets
    add column rejected_at timestamp;

insert into ticket_categories (code, name, description, is_active)
values
    ('ELECTRICAL', 'Electrical', 'Power, lighting, wiring, switches, and related electrical faults.', true),
    ('IT_NETWORK', 'IT / Network', 'Campus internet, Wi-Fi, network ports, and general IT connectivity issues.', true),
    ('AV_EQUIPMENT', 'AV / Equipment', 'Projectors, speakers, display panels, microphones, and classroom AV equipment.', true),
    ('FURNITURE_INTERIOR', 'Furniture / Interior', 'Desks, chairs, tables, fittings, and interior fixture damage.', true),
    ('HVAC_ENVIRONMENT', 'HVAC / Environment', 'Air conditioning, ventilation, temperature, and indoor environment issues.', true),
    ('PLUMBING_SANITATION', 'Plumbing / Sanitation', 'Water supply, leaks, drains, washrooms, and sanitation issues.', true),
    ('CLEANING_HOUSEKEEPING', 'Cleaning / Housekeeping', 'Cleaning requests, waste handling, spills, and housekeeping issues.', true),
    ('SAFETY_SECURITY', 'Safety / Security', 'Unsafe conditions, hazards, access control, and campus security concerns.', true),
    ('FACILITY_DAMAGE', 'Facility Damage', 'Structural damage, walls, floors, doors, windows, and general campus damage.', true),
    ('OTHER', 'Other', 'Any maintenance or incident report that does not fit the standard categories.', true)
on conflict (code) do nothing;
