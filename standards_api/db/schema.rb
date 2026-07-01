# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 0) do
  create_schema "extensions"

  # These are extensions that must be enabled in order to support this database
  enable_extension "extensions.pg_net"
  enable_extension "extensions.pg_stat_statements"
  enable_extension "extensions.pgcrypto"
  enable_extension "extensions.uuid-ossp"
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vault.supabase_vault"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "public.booking_status", ["confirmed", "waitlist", "cancelled"]
  create_enum "public.infraction_reason", ["late_cancel", "no_show"]
  create_enum "public.infraction_status", ["pending_review", "counted", "waived", "penalty_applied"]
  create_enum "public.user_role", ["admin", "manager", "coach", "athlete", "guest"]

  create_table "public.benchmarks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }
    t.date "date", default: -> { "CURRENT_DATE" }, null: false
    t.virtual "estimated_1rm", type: :decimal, as: "(score * (1.0 + ((reps)::numeric / 30.0)))", stored: true
    t.uuid "movement_id", null: false
    t.text "notes"
    t.uuid "profile_id", null: false
    t.integer "reps", default: 1, null: false
    t.decimal "score", null: false
    t.index ["profile_id", "movement_id"], name: "idx_benchmarks_profile"
  end

  create_table "public.bookings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_id", null: false
    t.timestamptz "created_at", default: -> { "now()" }
    t.uuid "profile_id", null: false
    t.timestamptz "promoted_at"
    t.enum "status", default: "confirmed", enum_type: "booking_status"
    t.index ["class_id", "profile_id"], name: "idx_one_active_booking_per_athlete", unique: true, where: "(status = ANY (ARRAY['confirmed'::booking_status, 'waitlist'::booking_status]))"
  end

  create_table "public.classes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "capacity", default: 15
    t.text "class_type", default: "Crossfit", null: false
    t.uuid "coach_id"
    t.integer "confirmed_bookings_count", default: 0, null: false
    t.timestamptz "created_at", default: -> { "now()" }
    t.timestamptz "end_time", null: false
    t.uuid "location_id", null: false
    t.uuid "program_id"
    t.timestamptz "start_time", null: false
  end

  create_table "public.infractions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_id", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "location_id", null: false
    t.text "notes"
    t.uuid "profile_id", null: false
    t.enum "reason", null: false, enum_type: "infraction_reason"
    t.enum "status", default: "pending_review", null: false, enum_type: "infraction_status"
    t.index ["profile_id", "location_id"], name: "idx_infractions_profile_location"
    t.index ["status"], name: "idx_infractions_status"
  end

  create_table "public.locations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "name", null: false
    t.jsonb "settings", default: {"classTypes" => [{"name" => "CrossFit", "color" => "#4E79A7", "isActive" => true, "defaultCoachId" => nil, "isProgrammable" => true, "defaultCapacity" => 15, "defaultDuration" => 60}, {"name" => "Weightlifting", "color" => "#F28E2B", "isActive" => true, "defaultCoachId" => nil, "isProgrammable" => false, "defaultCapacity" => 8, "defaultDuration" => 60}, {"name" => "Gymnastics", "color" => "#59A14F", "isActive" => true, "defaultCoachId" => nil, "isProgrammable" => true, "defaultCapacity" => 8, "defaultDuration" => 60}, {"name" => "Open Box", "color" => "#d2d4c8", "isActive" => true, "defaultCoachId" => nil, "isProgrammable" => false, "defaultCapacity" => 5, "defaultDuration" => 60}], "hiddenDays" => [0], "defaultClassColor" => "#d2d4c8"}
    t.text "slug", null: false
    t.jsonb "theme", default: {}

    t.unique_constraint ["slug"], name: "locations_slug_key"
  end

  create_table "public.memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "booking_delay_minutes", default: "0.0"
    t.timestamptz "booking_lockout_until"
    t.timestamptz "created_at", default: -> { "now()" }
    t.uuid "location_id", null: false
    t.uuid "profile_id", null: false
    t.enum "role", default: "athlete", null: false, enum_type: "user_role"
    t.text "status", default: "active"

    t.check_constraint "status = ANY (ARRAY['active'::text, 'pending'::text, 'rejected'::text])", name: "memberships_status_check"
    t.unique_constraint ["profile_id", "location_id"], name: "memberships_profile_id_location_id_key"
  end

  create_table "public.movement_standards", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "timezone('utc'::text, now())" }, null: false
    t.text "gender", null: false
    t.decimal "level_advanced_kg"
    t.decimal "level_elite_kg"
    t.decimal "level_intermediate_kg"
    t.decimal "level_novice_kg"
    t.decimal "level_untrained_kg"
    t.decimal "level_world_record_kg"
    t.integer "max_age", null: false
    t.decimal "max_bodyweight_kg"
    t.integer "min_age", null: false
    t.decimal "min_bodyweight_kg", null: false
    t.uuid "movement_id", null: false
    t.timestamptz "updated_at", default: -> { "timezone('utc'::text, now())" }, null: false

    t.unique_constraint ["movement_id", "gender", "min_age", "min_bodyweight_kg"], name: "movement_standards_movement_id_gender_min_age_min_bodyweigh_key"
  end

  create_table "public.movements", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "aliases", default: [], array: true
    t.text "category", null: false
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "description"
    t.jsonb "distribution", default: {}
    t.text "measurement_type", null: false
    t.text "name", null: false
    t.text "slug", null: false

    t.check_constraint "category = ANY (ARRAY['weight'::text, 'distance'::text, 'skill'::text, 'accessory'::text])", name: "check_category"
    t.check_constraint "measurement_type = ANY (ARRAY['weight'::text, 'time'::text, 'reps'::text, 'distance'::text, 'calories'::text])", name: "check_measurement"
    t.unique_constraint ["slug"], name: "movements_slug_key"
  end

  create_table "public.notification_events", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_id", null: false
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.uuid "location_id", null: false
    t.jsonb "payload", default: {}
    t.timestamptz "processed_at"
    t.uuid "profile_id"
    t.text "type", null: false
    t.check_constraint "type = ANY (ARRAY['waitlist_promoted'::text, 'spot_broadcasted'::text])", name: "notification_events_type_check"
  end

  create_table "public.profiles", id: :uuid, default: nil, force: :cascade do |t|
    t.text "avatar_url"
    t.date "birthdate"
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "display_name"
    t.text "email"
    t.text "emergency_contact_name"
    t.text "emergency_contact_phone"
    t.text "emoji"
    t.text "first_name"
    t.text "gender"
    t.uuid "last_location_id"
    t.text "last_name"
    t.text "phone"
    t.jsonb "preferences", default: {}
  end

  create_table "public.program_workouts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "program_id", null: false
    t.integer "sort_order", default: 0, null: false
    t.uuid "workout_id", null: false
  end

  create_table "public.programs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "class_type", null: false
    t.timestamptz "created_at", default: -> { "now()" }
    t.uuid "location_id"
    t.date "program_date"
    t.text "title"
    t.timestamptz "updated_at", default: -> { "now()" }

    t.unique_constraint ["program_date", "class_type"], name: "programs_date_type_key"
  end

  create_table "public.results", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "class_id", null: false
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "notes"
    t.uuid "profile_id", null: false
    t.text "score", null: false
    t.uuid "workout_id"
  end

  create_table "public.workouts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "class_type"
    t.text "clean_description"
    t.text "coach_notes"
    t.timestamptz "created_at", default: -> { "now()" }
    t.uuid "created_by"
    t.text "description", null: false
    t.integer "duration"
    t.text "error"
    t.uuid "location_id"
    t.text "slug", null: false
    t.text "status", default: "pending", null: false
    t.jsonb "structured_data", default: {}
    t.text "tags", default: [], array: true
    t.text "title"
    t.text "workout_type"
    t.index ["slug"], name: "idx_workouts_slug"
    t.check_constraint "status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'error'::text])", name: "workouts_status_check"
    t.unique_constraint ["slug"], name: "workouts_slug_key"
  end

  add_foreign_key "public.benchmarks", "public.movements", name: "benchmark_movement_id_fkey", on_delete: :cascade
  add_foreign_key "public.benchmarks", "public.profiles", name: "benchmark_profile_id_fkey", on_delete: :cascade
  add_foreign_key "public.bookings", "public.classes", name: "bookings_class_id_fkey"
  add_foreign_key "public.bookings", "public.profiles", name: "bookings_user_id_fkey"
  add_foreign_key "public.classes", "public.locations", name: "classes_location_id_fkey"
  add_foreign_key "public.classes", "public.profiles", column: "coach_id", name: "classes_coach_id_fkey"
  add_foreign_key "public.classes", "public.programs", name: "classes_programme_id_fkey", on_delete: :nullify
  add_foreign_key "public.infractions", "public.classes", name: "infractions_class_id_fkey", on_delete: :cascade
  add_foreign_key "public.infractions", "public.locations", name: "infractions_location_id_fkey", on_delete: :cascade
  add_foreign_key "public.infractions", "public.profiles", name: "infractions_profile_id_fkey", on_delete: :cascade
  add_foreign_key "public.memberships", "public.locations", name: "memberships_location_id_fkey", on_delete: :cascade
  add_foreign_key "public.memberships", "public.profiles", name: "memberships_profile_id_fkey", on_delete: :cascade
  add_foreign_key "public.movement_standards", "public.movements", name: "movement_standards_movement_id_fkey", on_delete: :cascade
  add_foreign_key "public.notification_events", "public.classes", name: "notification_events_class_id_fkey", on_delete: :cascade
  add_foreign_key "public.notification_events", "public.locations", name: "notification_events_location_id_fkey", on_delete: :cascade
  add_foreign_key "public.notification_events", "public.profiles", name: "notification_events_profile_id_fkey", on_delete: :cascade
  add_foreign_key "public.profiles", "auth.users", column: "id", name: "profiles_id_fkey", on_delete: :cascade
  add_foreign_key "public.profiles", "public.locations", column: "last_location_id", name: "profiles_last_location_id_fkey"
  add_foreign_key "public.program_workouts", "public.programs", name: "programme_workouts_programme_id_fkey", on_delete: :cascade
  add_foreign_key "public.program_workouts", "public.workouts", name: "programme_workouts_workout_id_fkey", on_delete: :cascade
  add_foreign_key "public.programs", "public.locations", name: "fk_programs_location", on_delete: :cascade
  add_foreign_key "public.results", "public.classes", name: "results_class_id_fkey"
  add_foreign_key "public.results", "public.profiles", name: "results_user_id_fkey"
  add_foreign_key "public.results", "public.workouts", name: "results_workout_id_fkey"
  add_foreign_key "public.workouts", "public.locations", name: "workouts_location_id_fkey", on_delete: :cascade
  add_foreign_key "public.workouts", "public.profiles", column: "created_by", name: "workouts_created_by_fkey"

end
