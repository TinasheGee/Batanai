// Debug: Test what coordinates browser geolocation returns

// For testing purposes, simulate what coordinates might be returned
// In a real browser, this would be:
// navigator.geolocation.getCurrentPosition((position) => {
//   console.log('Latitude:', position.coords.latitude);
//   console.log('Longitude:', position.coords.longitude);
// });

console.log('\n🧪 Common coordinate issues:\n');
console.log(
  '1. If user is not in Zimbabwe, distances will be very large (thousands of km)'
);
console.log(
  "2. Browser geolocation might return GPS coordinates from user's actual location"
);
console.log(
  '3. For testing, coordinates should be in Zimbabwe (e.g., Harare: -17.8252, 31.0522)'
);
console.log(
  '\n💡 Solution: The frontend should detect if user is far from Zimbabwe and either:'
);
console.log('   a) Use a default Zimbabwe location (Harare)');
console.log('   b) Show a message that marketplace is Zimbabwe-only');
console.log('   c) Allow user to manually set their location\n');

// Test with a location far from Zimbabwe (e.g., USA)
const testLat = 40.7128; // New York
const testLng = -74.006;

console.log(`\n📍 If user is in New York [${testLat}, ${testLng}]:`);
console.log('   Distance to Harare would be ~12,000 km');
console.log('   Distance to Bulawayo would be ~12,200 km\n');

// Test with Zimbabwe location
const zimbabweLat = -17.8252;
const zimbabweLng = 31.0522;

console.log(`📍 If user is in Harare [${zimbabweLat}, ${zimbabweLng}]:`);
console.log('   Distance to Harare CBD would be 0-5 km');
console.log('   Distance to Bulawayo would be ~365 km\n');
