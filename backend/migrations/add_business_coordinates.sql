-- Add latitude and longitude columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add indexes for better performance on distance queries
CREATE INDEX IF NOT EXISTS idx_businesses_coordinates ON businesses(latitude, longitude);

-- Update comment
COMMENT ON COLUMN businesses.latitude IS 'Business location latitude for distance calculations';
COMMENT ON COLUMN businesses.longitude IS 'Business location longitude for distance calculations';
