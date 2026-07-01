namespace :data do
  desc "Normalize CSV standards and load them into the Supabase database"
  task import_csv: :environment do
    require "csv"
    require "dotenv/load"

    MOVEMENT_MAP = {
      "Squat" => "Back Squat",
      "Bench" => "Bench Press",
      "Deadlift" => "Deadlift",
      "Press" => "Shoulder Press",
      "Clean" => "Power Clean",
      "Snatch" => "Power Snatch"
    }

    data_dir = Rails.root.join("extracted_standards")

    unless Dir.exist?(data_dir)
      puts "Directory not found: #{data_dir}"
      exit
    end

    files = Dir.glob("#{data_dir}/*.csv")
    puts "Found #{files.size} CSV files to process."

    files.each do |file_path|
      filename = File.basename(file_path, ".csv")
      movement_name, gender, age_label = filename.split("_")
      movement_name = movement_name.capitalize
      db_target_name = MOVEMENT_MAP[movement_name] || movement_name
      movement = Movement.find_by!(name: db_target_name)

      # Map age labels to exact boundaries
      min_age, max_age = case age_label
      when "18" then [ 18, 39 ]
      when "40"  then [ 40, 49 ]
      when "50"  then [ 50, 59 ]
      when "60"  then [ 60, 69 ]
      end

      csv_data = CSV.read(file_path, headers: true)
      valid_rows_processed = 0
      current_min_bw = 0

      csv_data.each do |row|
        current_bw = row["Body Weight"] || row["Kilograms"] || row[0]
        next unless current_bw

        if current_bw.to_s.include?("+")
          min_bw = current_bw.to_i # automatically drops the '+'
          max_bw = nil
        else
          min_bw = current_min_bw
          max_bw = current_bw.to_i
        end

        current_min_bw = max_bw

        # Map to DB column names. Safe navigation (&.) handles missing columns gracefully.
        untrained_kg    = row["Untrained"]&.to_f
        novice_kg       = row["Novice"]&.to_f
        intermediate_kg = row["Intermediate"]&.to_f
        advanced_kg     = row["Advanced"]&.to_f
        elite_kg        = row["Elite"]&.to_f
        world_record_kg = row["World Record"]&.to_f

        # Upsert logic to prevent duplicates based on our new unique index
        standard = MovementStandard.find_or_initialize_by(
          movement: movement,
          gender: gender,
          min_age: min_age,
          min_bodyweight_kg: min_bw
        )

        standard.update!(
          max_age: max_age,
          max_bodyweight_kg: max_bw,
          level_untrained_kg: untrained_kg,
          level_novice_kg: novice_kg,
          level_intermediate_kg: intermediate_kg,
          level_advanced_kg: advanced_kg,
          level_elite_kg: elite_kg,
          level_world_record_kg: world_record_kg
        )

        valid_rows_processed += 1
      end

      puts "Processed #{movement_name} (#{gender}, #{age_label}): #{valid_rows_processed} rows."
    end

    puts "Database population complete."
  end
end
