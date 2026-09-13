import xlsx from 'xlsx';
import fs from 'fs';

const LIMIT = 50; // Giới hạn 50 cái đầu tiên để test
const DELAY = 1100; // 1.1s delay between requests to comply with Nominatim policy

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocode(addressStr) {
  // Add Ho Chi Minh City to context since most data seems to be there
  const query = encodeURIComponent(`${addressStr}, Hồ Chí Minh, Vietnam`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FindAndBindMapApp/1.0 (test@example.com)'
      }
    });
    
    if (!res.ok) {
        console.error(`API Error for ${addressStr}: ${res.status}`);
        return null;
    }
    
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (err) {
    console.error(`Fetch error for ${addressStr}:`, err);
    return null;
  }
}

async function run() {
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('data/cleaned_data.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  
  const toProcess = rawData.slice(0, LIMIT);
  const places = [];
  
  console.log(`Processing ${toProcess.length} locations...`);
  
  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    const name = row['Tên quán/địa điểm'] || 'Unnamed';
    const address = row['Địa chỉ'] || '';
    
    // Map category
    let category = 'restaurant';
    const rawCat = (row['Phân loại'] || '').toLowerCase();
    if (rawCat.includes('bar') || rawCat.includes('pub')) {
        category = 'landmark'; // using landmark icon for bar/pub as fallback
    } else if (rawCat.includes('khách sạn') || rawCat.includes('hotel')) {
        category = 'hotel';
    }
    
    console.log(`[${i+1}/${toProcess.length}] Geocoding: ${name} - ${address}...`);
    
    let coords = await geocode(address);
    if (!coords) {
        console.log(` -> Not found exactly. Trying fallback without district info...`);
        // Retry with just name and city if address is too weird
        coords = await geocode(name);
        
        if(!coords) {
            console.log(` -> Still not found. Assigning mock coords nearby District 1`);
            // Generate mock coordinates around Q1 center (10.7769, 106.7009)
            coords = {
                lat: 10.7769 + (Math.random() - 0.5) * 0.02,
                lon: 106.7009 + (Math.random() - 0.5) * 0.02,
            }
        }
    }
    
    places.push({
      id: `poi-${i}-${Date.now()}`,
      name: name,
      category: category,
      lat: coords.lat,
      lon: coords.lon,
      rating: parseFloat((4 + Math.random()).toFixed(1)), // mock rating
      reviews: Math.floor(Math.random() * 500) + 10,
      image: 'bg-gradient-nature',
      description: row['Ghi chú/Review'] || row['Món gợi ý'] || 'Không có mô tả chi tiết.',
      distance: (Math.random() * 5).toFixed(1) + ' km',
      raw_address: address,
      price: row['Giá'] || row['Giá chuẩn'] || 'N/A'
    });
    
    await sleep(DELAY);
  }
  
  fs.writeFileSync('src/assets/places.json', JSON.stringify(places, null, 2), 'utf-8');
  console.log(`\n✅ Done! Saved ${places.length} places to src/assets/places.json`);
}

run();
