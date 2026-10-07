import {
  AirlineSeatReclineNormal,
  LocalGasStation,
  LocalParking,
  Place,
  Restaurant,
  Shower,
  Wc,
} from '@mui/icons-material';

// Icon per PLACE_CATEGORIES value (utils/variables.js). Named imports keep the
// bundle to these few icons; a category missing here gets the map pin.
const ICONS = {
  fuel: LocalGasStation,
  food: Restaurant,
  restroom: Wc,
  'rest-area': AirlineSeatReclineNormal,
  'truck-parking': LocalParking,
  showers: Shower,
};

function PlaceCategoryIcon({ category, ...props }) {
  const Icon = ICONS[category] ?? Place;
  return <Icon {...props} />;
}

export default PlaceCategoryIcon;
