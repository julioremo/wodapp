require 'nokogiri'
require 'open-uri'
require 'csv'
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
      # Extract all cells into a 2D array of text strings
      raw_table = table.css('tr').map do |row|
        row.css('th, td').map { |cell| cell.text.strip }
      end
      
      # Determine gender from table header
      first_row_text = raw_table.first&.join(" ") || ""
      gender = nil
      if first_row_text.include?("Men")
        gender = "male"
      elsif first_row_text.include?("Women")
        gender = "female"
      end
			next unless gender

      row_lengths = raw_table.map(&:length)
      modal_length = row_lengths.tally.max_by { |_, count| count }&.first
      next unless modal_length

      table_data = raw_table.select { |row| row.length == modal_length }
			
      age_label = age.empty? ? "18" : age
      filename = "#{movement.downcase}_#{gender}_#{age_label}.csv"
      filepath = File.join(output_dir, filename)

      CSV.open(filepath, "w") do |csv|
        table_data.each { |row| csv << row }
      end

      puts "  -> Saved #{filepath}"
    end

  rescue => e
    puts "Failed to parse #{url}: #{e.message}"
  end
  
  sleep 1
end

puts "Extraction complete."