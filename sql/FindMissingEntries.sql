select distinct file from translate;
-- Mobs
select id, eng, spa, fre
FROM translate T
LEFT JOIN mobs M ON M.mob_id = T.id
WHERE file = 'monster_template_display_name'
 AND M.mob_id IS NULL;

select M.name,id, eng, spa, fre
FROM translate T
JOIN mobs M ON M.mob_id = T.id  AND M.name != T.eng
WHERE file = 'monster_template_display_name';
-- NPCS
select id, eng, spa, fre
FROM translate T
LEFT JOIN npcs N ON N.npc_id = T.id
WHERE file = 'npc_instance_display_name'
 AND N.npc_id IS NULL;

select N.name, id, eng, spa, fre
FROM translate T
JOIN npcs N ON N.npc_id = T.id AND N.name != T.eng
WHERE file = 'npc_instance_display_name';
-- Zones
select id, eng, spa, fre, deu
FROM translate T
LEFT JOIN zones Z ON Z.zone_id = T.id
WHERE file = 'zone_display_name'
 AND Z.zone_id IS NULL;

select Z.name, id, eng, spa, fre, deu
FROM translate T
JOIN zones Z ON Z.zone_id = T.id AND Z.name != T.eng
WHERE file = 'zone_display_name';
