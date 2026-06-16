require 'nokogiri'
require 'open-uri'
require 'json'
require 'fileutils'

movements = ['Bench', 'Deadlift', 'Press', 'Clean', 'Snatch', 'Squat']
ages = ['', '40', '50', '60']

output_dir = "extracted_standards"
FileUtils.mkdir_p(output_dir)

# .product creates pairs: [["Bench", ""], ["Bench", "40"], ... ]
movements.product(ages).each do |movement, age|
  
  # Format the age suffix to avoid dangling "Kg" on the general population URLs
  suffix = age.empty? ? "Kg" : "#{age}Kg"
  
  standard_word = (movement == 'Bench' && !age.empty?) ? 'Standard' : 'Standards'
  
  url = "https://exrx.net/Testing/WeightLifting/#{movement}#{standard_word}#{suffix}"
  
  puts "Fetching: #{url}"
  
  begin
    html = URI.open(url)
    doc = Nokogiri::HTML(html)
    
		doc.css('table').each do |table|
      first_row_text = table.at_css('tr')&.text || ""
      
      # Determine gender from the table header
      gender = nil
      if first_row_text.include?("Men")
        gender = "male"
      elsif first_row_text.include?("Women")
        gender = "female"
      end

			next unless gender # Skip utility tables

			table_data = []
      
      table.css('tr').each do |row|
        cells = row.css('td').map { |td| td.text.strip }
        
        # Integrity Check: 
        # 1. Must have at least 6 columns (BW + 5 tiers)
        # 2. First column must start with a digit (ignores headers like "Kilograms")
        is_valid_row = cells.length >= 6 && cells[0].match?(/^\d+/)
        
        next unless is_valid_row

				# Clean bodyweight string (removes the '+' from '145+')
        clean_bw = cells[0].tr('+', '').to_i
				# Map row to schema
        table_data << {
          movement: movement,
          age_category: age.empty? ? "18-39" : "#{age}-#{age.to_i + 9}",
          gender: gender,
          bodyweight_kg: clean_bw,
          beginner_kg: cells[1].to_f,
          novice_kg: cells[2].to_f,
          intermediate_kg: cells[3].to_f,
          advanced_kg: cells[4].to_f,
          elite_kg: cells[5].to_f
        }
      end
			
			# Only write a file if valid rows were found
      if table_data.any?
        age_label = age.empty? ? "18" : age
        filename = "#{movement.downcase}_#{gender}_#{age_label}.json"
        
				filepath = File.join(output_dir, filename)
        File.open(filepath, "w") do |file|
          file.write(JSON.pretty_generate(table_data))
        end
        
        puts "  -> Saved #{filename}"
      end
    end
  rescue => e
    puts "Failed to parse #{url}: #{e.message}"
  end
  
  sleep 1
end

puts "Extraction complete."