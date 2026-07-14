export interface CountryLocationData {
  cities: string[];
  areas: { [cityName: string]: string[] };
}

export const COUNTRY_DATA: { [countryName: string]: CountryLocationData } = {
  Pakistan: {
    cities: ['Lahore', 'Islamabad'],
    areas: {
      Lahore: [
        'DHA Phase 5', 'DHA Phase 6', 'Gulberg III', 'Model Town', 'Johar Town',
        'Cantt', 'Bahria Town', 'Wapda Town', 'Askari 10', 'Iqbal Town',
        'Township', 'Garden Town', 'Valencia Town', 'Faisal Town',
      ],
      Islamabad: [
        'F-7 Markaz', 'F-8 Markaz', 'F-10', 'G-11 Sector', 'G-9', 'E-7 Sector',
        'E-11', 'DHA Phase 2', 'Bahria Town Islamabad', 'Bani Gala',
      ]
    },
  },

};

export const getCountryFromPhone = (phoneNumber?: string): string => {
  if (!phoneNumber) return 'Pakistan';
  const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');

  if (cleanPhone.startsWith('+92') || cleanPhone.startsWith('92')) return 'Pakistan';

  return 'Pakistan';
};