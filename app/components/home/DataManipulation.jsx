'use client';

import { BetpaCenters } from '@/utils/centers';

function DataManipulation() {
  const newBetpaCenters = BetpaCenters.map((center) => {
    return {
      created_at: center.created_at,
      numSlic: center.numSlic,
      alphaSlic: center.alphaSlic,
      name: center.name || '',
      address: {
        street: center.street || '',
        city: center.city || '',
        zip: center.zip || '',
      },
      phone: center.phone || '',
      directions: '',
      type: 'center',
      comments: [],
    };
  });

  const json = JSON.stringify(newBetpaCenters, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => alert('Copied'))
    .catch((err) => alert('Failed to copy: ', err));

  return <div>DATA MANIPULATION</div>;
}

export default DataManipulation;
