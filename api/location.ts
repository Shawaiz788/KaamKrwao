const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_URL = BASE_URL ? BASE_URL.replace(/\/$/, '') : '';

import { Country, getCountries, createCountry } from './country';
import { City, getCities, getCitiesByCountry, createCity } from './city';
import { Area, getAreas, getAreasByCity, createArea } from './area';

export { Country, getCountries, createCountry };
export { City, getCities, getCitiesByCountry, createCity };
export { Area, getAreas, getAreasByCity, createArea };

export interface UserLocation {
  id?: number;
  house_number?: number;
  street_number?: string;
  area?: number;
  city?: number;
  country?: number;
  area_id?: number;
  city_id?: number;
  country_id?: number;
  landmark?: string;
  pin_location?: string;
  zip_code?: number;
}

export const createLocation = async (location: UserLocation): Promise<UserLocation> => {
  console.log('[createLocation API] Sending payload:', JSON.stringify(location, null, 2));
  const response = await fetch(`${API_URL}/locations/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(location),
  });

  const responseText = await response.text();
  console.log('[createLocation API] Response Status:', response.status);
  console.log('[createLocation API] Response Body:', responseText);

  if (!response.ok) {
    throw new Error(`Failed to create location. Status: ${response.status}. Response: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse location response as JSON. Content: ${responseText}`);
  }
};

export const getLocationById = async (id: number): Promise<UserLocation> => {
  console.log(`[getLocationById API] Fetching location details for ID: ${id}`);
  const response = await fetch(`${API_URL}/locations/${id}/`);
  const responseText = await response.text();
  console.log('[getLocationById API] Response Status:', response.status);
  console.log('[getLocationById API] Response Body:', responseText);

  if (!response.ok) {
    throw new Error(`Failed to fetch location by ID. Status: ${response.status}. Response: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse location response as JSON. Content: ${responseText}`);
  }
};

export interface LocationChainInput {
  countryName: string;
  cityName: string;
  areaName: string;
  houseNumber: string;
  streetNumber: string;
  pinLocation: string;
  zipCode: string;
  landmark?: string;
}

export const getOrCreateLocationChain = async (input: LocationChainInput): Promise<UserLocation> => {
  const { countryName, cityName, areaName, houseNumber, streetNumber, pinLocation, zipCode, landmark } = input;
  console.log('[LocationChain] Starting resolution for:', input);

  // 1. Resolve Country
  let countryId: number;
  const countries = await getCountries();
  const existingCountry = countries.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (existingCountry) {
    countryId = existingCountry.id;
    console.log('[LocationChain] Country exists with ID:', countryId);
  } else {
    console.log('[LocationChain] Country does not exist, creating:', countryName);
    const newCountry = await createCountry(countryName);
    countryId = newCountry.id;
    console.log('[LocationChain] Country created with ID:', countryId);
  }

  // 2. Resolve City
  let cityId: number;
  const cities = await getCities();
  const existingCity = cities.find(
    (c: any) => {
      const matchName = c.name.toLowerCase() === cityName.toLowerCase();
      if (!matchName) return false;
      const cId = typeof c.country === 'object' ? c.country?.id : c.country;
      return !cId || cId === countryId;
    }
  );
  if (existingCity) {
    cityId = existingCity.id;
    console.log('[LocationChain] City exists with ID:', cityId);
  } else {
    console.log('[LocationChain] City does not exist, creating:', cityName);
    const newCity = await createCity(countryId, cityName);
    cityId = newCity.id;
    console.log('[LocationChain] City created with ID:', cityId);
  }

  // 3. Resolve Area
  let areaId: number;
  const areas = await getAreas();
  const existingArea = areas.find(
    (a: any) => {
      const matchName = a.name.toLowerCase() === areaName.toLowerCase();
      if (!matchName) return false;
      const cId = typeof a.city === 'object' ? a.city?.id : a.city;
      return !cId || cId === cityId;
    }
  );
  if (existingArea) {
    areaId = existingArea.id;
    console.log('[LocationChain] Area exists with ID:', areaId);
  } else {
    console.log('[LocationChain] Area does not exist, creating:', areaName);
    const newArea = await createArea(cityId, areaName);
    areaId = newArea.id;
    console.log('[LocationChain] Area created with ID:', areaId);
  }

  // 4. Create User Location
  const locationPayload: UserLocation = {
    country_id: countryId,
    city_id: cityId,
    area_id: areaId,
    house_number: houseNumber ? Number(houseNumber) : undefined,
    street_number: streetNumber,
    pin_location: pinLocation,
    zip_code: zipCode ? Number(zipCode) : undefined,
    landmark,
  };

  console.log('[LocationChain] Creating Location with payload:', locationPayload);
  return await createLocation(locationPayload);
};
