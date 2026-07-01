class Movement < ApplicationRecord
  has_many :movement_standards, dependent: :destroy
end
