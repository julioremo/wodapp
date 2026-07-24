ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emoji TEXT;

UPDATE public.profiles AS p
SET 
    gender = temp.gender,
    birthdate = temp.birthdate::DATE,
    emoji = temp.emoji
FROM (VALUES
    ('c90f9fd3-f3b8-447a-aced-b7de7f3f1510'::uuid, 'male', '1990-05-15', '🥵'),
    ('30eec07d-510c-466d-a8cc-549ad97489b1'::uuid, 'male', '1985-11-22', '🤓'),
    ('b384176b-7b0e-4561-a479-d62badc247b3'::uuid, 'male', '1992-03-10', '🥸'),
    ('993b115f-65b6-4a67-944f-c0e765536abe'::uuid, 'male', '1995-07-08', '👽'),
    ('4a2ac3c2-52f3-4761-9109-7526f14a0c3c'::uuid, 'male', '2001-09-01', '👨‍🎓'),
    ('2464c045-bad2-4c4f-9e60-d6b40e9a6946'::uuid, 'male', '1970-12-14', '👷‍♂️'),
    ('a0b0b921-8ebf-4a1b-9e7a-cafd33e57f96'::uuid, 'male', '1988-04-20', '🤠'),
    ('0bb2a911-5a08-432c-bab6-db8ae1bb7c0a'::uuid, 'male', '1996-01-30', '🤙'),
    ('07fc2278-42e0-4ab6-bb45-4118e99faae8'::uuid, 'male', '1982-08-05', '👨‍💼'),
    ('bd8d2b51-7df8-41ca-baa2-bbfe79f4c801'::uuid, 'male', '1993-02-18', '🌭'),
    ('5682089e-4b0e-42ad-b060-5a678b012670'::uuid, 'male', '1975-10-10', '🕵️‍♂️'),
    ('190e3428-c31c-46c1-8be7-4a68f993e96f'::uuid, 'male', '1991-06-25', '🤖'),
    ('3d4c7f59-7bce-4da5-be20-e7cf2531e5ac'::uuid, 'male', '1998-11-11', '🐶'),
    ('6de43e22-5471-41d2-94dd-4e70c27e2a86'::uuid, 'female', '1994-05-02', '👩‍🎤'),
    ('cd695c44-c38e-44b7-a81e-5779ff2522c5'::uuid, 'female', '1997-09-21', '🍰'),
    ('f54159cd-225f-47d7-ab0c-7d08e7df2ec4'::uuid, 'male', '1968-03-30', '👴'),
    ('21251a03-9df2-42b0-967a-8ccd807092e0'::uuid, 'male', '1984-12-07', '🤫'),
    ('6d31793d-8858-431a-9aa2-daa675436f27'::uuid, 'male', '1989-07-19', '🧙‍♂️'),
    ('b9310a2e-814f-489b-8ffc-aa0acdd584d0'::uuid, 'female', '1995-10-28', '👸'),
    ('af010946-db92-4759-9eb8-2bbd6ea8537b'::uuid, 'male', '1986-02-14', '🤘'),
    ('a3e80290-9fad-4af0-8f1b-887cb6f1e535'::uuid, 'female', '1965-08-08', '💃'),
    ('361f9f37-5c04-4ac3-9df7-1df54503293c'::uuid, 'male', '1990-11-03', '🧑‍🎨'),
    ('dd60504e-a3bb-4ae9-9d79-22d54ad7e43c'::uuid, 'male', '1993-04-12', '🥳'),
    ('3e010fe9-2703-44b7-84cd-a0e62c4c88bc'::uuid, 'female', '1987-01-25', '🥷'),
    ('723f3ae7-3681-422c-b4f6-25bae3d31cb9'::uuid, 'male', '1981-06-16', '🧛‍♂️'),
    ('5177fc13-77c2-4c45-a91f-b0f9eef3802b'::uuid, 'male', '1978-09-29', '🧟‍♂️'),
    ('ad488776-ca09-4f0b-9d2b-7a298dcecbe1'::uuid, 'female', '1992-12-03', '🧚‍♀️'),
    ('9c29d233-74cb-474d-9c20-6b0a30ff430a'::uuid, 'female', '1994-07-07', '🙋‍♀️'),
    ('90f0e3ef-5da3-4f48-9e67-42dea76c2569'::uuid, 'male', '1999-02-18', '🤡'),
    ('b0c3b62e-8947-44f3-a36e-0a56d6f60fc2'::uuid, 'female', '1983-05-11', '👩‍🚒')
) AS temp(id, gender, birthdate, emoji)
WHERE p.id = temp.id;