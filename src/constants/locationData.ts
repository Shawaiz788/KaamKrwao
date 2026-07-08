export interface CountryLocationData {
  cities: string[];
  areas: { [cityName: string]: string[] };
}

export const COUNTRY_DATA: { [countryName: string]: CountryLocationData } = {
  Pakistan: {
    cities: [
      'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
      'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad',
    ],
    areas: {
      Lahore: [
        'DHA Phase 5', 'DHA Phase 6', 'Gulberg III', 'Model Town', 'Johar Town',
        'Cantt', 'Bahria Town', 'Wapda Town', 'Askari 10', 'Iqbal Town',
        'Township', 'Garden Town', 'Valencia Town', 'Faisal Town',
      ],
      Karachi: [
        'Clifton Block 4', 'Clifton Block 9', 'DHA Phase 6', 'DHA Phase 8', 'PECHS',
        'Gulshan-e-Iqbal', 'North Nazimabad', 'Bahadurabad', 'Malir Cantt',
        'Korangi', 'Nazimabad', 'Gulistan-e-Jauhar',
      ],
      Islamabad: [
        'F-7 Markaz', 'F-8 Markaz', 'F-10', 'G-11 Sector', 'G-9', 'E-7 Sector',
        'E-11', 'DHA Phase 2', 'Bahria Town Islamabad', 'Bani Gala',
      ],
      Rawalpindi: [
        'Bahria Town Rwp', 'Saddar', 'Satellite Town', 'Adyala Road',
        'Chaklala Scheme 3', 'Westridge', 'PWD Housing Scheme',
      ],
      Faisalabad: ['Peoples Colony', 'D Ground', 'Madina Town', 'Jinnah Colony', 'Susan Road'],
      Multan: ['Cantt', 'Gulgasht Colony', 'Shah Rukn-e-Alam', 'Bosan Road'],
      Peshawar: ['Hayatabad', 'University Town', 'Cantt', 'Warsak Road'],
      Quetta: ['Cantt', 'Jinnah Town', 'Satellite Town Quetta', 'Airport Road'],
      Sialkot: ['Cantt', 'Model Town Sialkot', 'Paris Road'],
      Gujranwala: ['Model Town Gujranwala', 'Satellite Town Gujranwala', 'Civil Lines'],
      Hyderabad: ['Latifabad', 'Qasimabad', 'Cantt Hyderabad'],
    },
  },
  UAE: {
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
    areas: {
      Dubai: [
        'Downtown Dubai', 'Dubai Marina', 'Jumeirah', 'Palm Jumeirah', 'Business Bay',
        'Al Barsha', 'Deira', 'Al Qusais', 'International City', 'Discovery Gardens',
        'Jumeirah Village Circle',
      ],
      'Abu Dhabi': [
        'Yas Island', 'Al Khalidiyah', 'Al Reem Island', 'Khalifa City',
        'Tourist Club Area', 'Al Mushrif', 'Al Nahyan',
      ],
      Sharjah: ['Al Majaz', 'Al Nahda (Sharjah)', 'Muwaileh', 'Al Khan', 'Al Qasimia'],
      Ajman: ['Al Nuaimiya', 'Al Rashidiya', 'Al Jurf'],
      'Ras Al Khaimah': ['Al Nakheel', 'Al Dhait', 'Mina Al Arab'],
    },
  },
  'Saudi Arabia': {
    cities: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar'],
    areas: {
      Riyadh: ['Al Olaya', 'Al Malaz', 'Al Yasmin', 'Al Sulaimaniyah', 'Al Murabba', 'Al Nakheel'],
      Jeddah: ['Al Hamra', 'Al Naeem', 'Al Safa', 'Al Shaty', 'Al Zahra', 'Al Rawdah'],
      Dammam: ['Al Shatea', 'Al Faisaliyah', 'Al Jalawiyah', 'Al Hamra KSA'],
      Mecca: ['Al Aziziyah', 'Al Naseem', 'Al Shoqiyah'],
      Medina: ['Al Haram', 'Quba', 'Al Awali'],
      Khobar: ['Al Rakah', 'Al Ulaya', 'Al Thuqbah'],
    },
  },
  Qatar: {
    cities: ['Doha', 'Al Rayyan', 'Al Wakrah'],
    areas: {
      Doha: ['West Bay', 'The Pearl', 'Al Sadd', 'Al Muntazah', 'Msheireb'],
      'Al Rayyan': ['Al Waab', 'Ain Khalid', 'Muaither'],
      'Al Wakrah': ['Al Wukair', 'Wakrah Corniche'],
    },
  },
  Oman: {
    cities: ['Muscat', 'Salalah', 'Sohar'],
    areas: {
      Muscat: ['Al Khuwair', 'Qurum', 'Ruwi', 'Al Mouj', 'Bausher'],
      Salalah: ['Al Wadi', 'Salalah Beach'],
      Sohar: ['Sohar Industrial', 'Falaj Al Qabail'],
    },
  },
  USA: {
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco Bay Area'],
    areas: {
      'New York': ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
      'Los Angeles': ['Hollywood', 'Downtown LA', 'Santa Monica', 'Venice Beach', 'Beverly Hills'],
      Chicago: ['Loop', 'Lincoln Park', 'Wicker Park', 'Hyde Park', 'River North'],
      Houston: ['Sugar Land', 'Katy', 'Midtown Houston', 'The Heights'],
      'San Francisco Bay Area': ['Fremont', 'San Jose', 'Sunnyvale', 'Union City'],
    },
  },
  UK: {
    cities: ['London', 'Birmingham', 'Manchester', 'Bradford', 'Luton'],
    areas: {
      London: ['Westminster', 'Camden', 'Kensington', 'Chelsea', 'Greenwich', 'Ilford'],
      Birmingham: ['Edgbaston', 'Harborne', 'Selly Oak', 'Moseley', 'Small Heath'],
      Manchester: ['Didsbury', 'Chorlton', 'Ancoats', 'Northern Quarter', 'Longsight'],
      Bradford: ['Manningham', 'Great Horton', 'Bradford Moor'],
      Luton: ['Bury Park', 'Farley Hill'],
    },
  },
};

export const getCountryFromPhone = (phoneNumber?: string): string => {
  if (!phoneNumber) return 'Pakistan';
  const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');

  if (cleanPhone.startsWith('+92') || cleanPhone.startsWith('92')) return 'Pakistan';
  if (cleanPhone.startsWith('+971') || cleanPhone.startsWith('971')) return 'UAE';
  if (cleanPhone.startsWith('+966') || cleanPhone.startsWith('966')) return 'Saudi Arabia';
  if (cleanPhone.startsWith('+974') || cleanPhone.startsWith('974')) return 'Qatar';
  if (cleanPhone.startsWith('+968') || cleanPhone.startsWith('968')) return 'Oman';
  if (cleanPhone.startsWith('+1') || cleanPhone.startsWith('1')) return 'USA';
  if (cleanPhone.startsWith('+44') || cleanPhone.startsWith('44')) return 'UK';

  return 'Pakistan';
};