'use client';

import { betpaCustomers } from '@/utils/customers';

function DataManipulation() {
  const newBetpaCustomers = betpaCustomers.map((customer) => {
    return {
      created_at: customer.created_at,
      numSlic: customer.numSlic,
      alphaSlic: customer.alphaSlic,
      name: customer.name || '',
      address: {
        street: customer.street || '',
        city: customer.city || '',
        zip: customer.zip || '',
      },
      phone: customer.phone || '',
      directions: '',
      type: 'customer',
      comments: [],
    };
  });

  const json = JSON.stringify(newBetpaCustomers, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => alert('Copied'))
    .catch((err) => alert('Failed to copy: ', err));

  return <div>DATA MANIPULATION</div>;
}

export default DataManipulation;
