/**
 * Standard inspection areas for each supported AssetTrace asset type.
 *
 * These areas are used when creating an inspection so that the
 * guided inspection flow knows which parts of the asset to cover.
 */
export const INSPECTION_AREAS = {
  scooter: [
    'Front',
    'Left side',
    'Right side',
    'Rear',
    'Handlebars',
    'Dashboard',
  ],

  bike: [
    'Front',
    'Left side',
    'Right side',
    'Rear',
    'Handlebars',
    'Frame',
  ],

  apartment: [
    'Entrance',
    'Living room',
    'Kitchen',
    'Bedroom',
    'Bathroom',
    'Balcony',
  ],

  house: [
    'Entrance',
    'Living room',
    'Kitchen',
    'Bedrooms',
    'Bathrooms',
    'Staircase',
    'Outdoor area',
  ],

  wall: [
    'Full surface',
    'Left section',
    'Center section',
    'Right section',
    'Lower edge',
  ],
} as const