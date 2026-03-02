-- Migration: Add JSONB settings column to locations with object-based classTypes
ALTER TABLE locations
ADD COLUMN settings JSONB DEFAULT '{
  "defaultClassColor": "#d2d4c8",
  "hiddenDays": [0],
  "classTypes": [
    { "name": "CrossFit", "color": "#4E79A7", "isProgrammable": true, "isActive": true, "defaultCoachId": null, "defaultDuration": 60, "defaultCapacity": 15 },
    { "name": "Weightlifting", "color": "#F28E2B", "isProgrammable": false, "isActive": true, "defaultCoachId": null, "defaultDuration": 60, "defaultCapacity": 8 },
    { "name": "Gymnastics", "color": "#59A14F", "isProgrammable": true, "isActive": true, "defaultCoachId": null, "defaultDuration": 60, "defaultCapacity": 8 },
    { "name": "Open Box", "color": "#d2d4c8", "isProgrammable": false, "isActive": true, "defaultCoachId": null, "defaultDuration": 60, "defaultCapacity": 5 }
  ]
}'::jsonb;