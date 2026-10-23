-- "staff" is no longer an email audience. Recipients resolve to the role of
-- their clinic user; a recipient whose user no longer exists falls back to admins.
UPDATE "EmailRecipient" AS r
SET "audience" = CASE u."role"::text
  WHEN 'owner' THEN 'owners'
  WHEN 'admin' THEN 'admins'
  WHEN 'practitioner' THEN 'practitioners'
  WHEN 'financial' THEN 'financial'
END
FROM "ClinicUser" AS u
WHERE r."audience" = 'staff'
  AND u."id" = r."sourceId";

UPDATE "EmailRecipient"
SET "audience" = 'admins'
WHERE "audience" = 'staff';
