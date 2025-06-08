'use client';

import { allHubs } from '@/utils/allHubs';
import { BetpaCenters } from '@/utils/centers';
import { comments } from '@/utils/comments';
import { betpaCustomers } from '@/utils/customers';

function DataManipulation() {
  // const newAllHubs = allHubs.map((hub) => {
  //   return {
  //     created_at: hub.created_at,
  //     numSlic: hub.numSlic,
  //     alphaSlic: hub.alphaSlic,
  //     name: hub.name,
  //     phone: hub.phone,
  //     address: {
  //       street: hub.street,
  //       city: hub.city,
  //       state: hub.state,
  //       zip: hub.zip,
  //     },
  //   };
  // });

  // const json = JSON.stringify(newAllHubs, null, 2);
  // navigator.clipboard
  //   .writeText(json)
  //   .then(() => alert('Copied'))
  //   .catch((err) => alert('Failed to copy: ', err));

  return <div>DATA MANIPULATION</div>;
}

export default DataManipulation;
