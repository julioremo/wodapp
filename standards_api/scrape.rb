require 'nokogiri'
require 'open-uri'
require 'json'
require 'fileutils'

movements = ['Bench', 'Deadlift', 'Press', 'Clean', 'Snatch', 'Squat']
ages = ['', '40', '50', '60']

output_dir = "extracted_standards"
FileUtils.mkdir_p(output_dir)

movements.product(ages).each do |movement, age|
  standard_word = (movement == 'Bench' && !age.empty?) ? 'Standard' : 'Standards'
  url = "https://exrx.net/Testing/WeightLifting/#{movement}#{standard_word}#{age}Kg"
  
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

			next unless gender

			table_data = []
      
      table.css('tr').each do |row|
        cells = row.css('td').map { |td| td.text.strip }
        
        table_data << cells unless cells.empty?
      end
			
      if table_data.any?
        age_label = age.empty? ? "18" : age
        filename = "#{movement.downcase}_#{gender}_#{age_label}.json"
				filepath = File.join(output_dir, filename)

        payload = {
          movement: movement,
          gender: gender,
          age_category: age_label,
          raw_data: table_data
          
        }

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