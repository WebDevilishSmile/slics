'use client';

import { useEffect, useState } from 'react';

import AddressFields from './AddressFields';
import AlphaSlicField from './AlphaSlicField';
import FormActions from './FormActions';
import FormContainer from './FormContainer';
import NameField from './NameField';
import NumSlicField from './NumSlicField';
import PhoneField from './PhoneField';
import TypeRadio from './TypeRadio';
import Warning from './Warning';

function NewSlicForm() {
  const [type, setType] = useState('center');
  const [numSlic, setNumSlic] = useState('');
  const [alphaSlic, setAlphaSlic] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  const [openWarning, setOpenWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [slicData, setSlicData] = useState({
    created_at: new Date().toISOString(),
    type: 'center',
    numSlic: '',
    alphaSlic: '',
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
    directions: null,
  });

  const handleClear = () => {
    setType('center');
    setNumSlic('');
    setAlphaSlic('');
    setName('');
    setPhone('');
    setAddress({
      street: '',
      city: '',
      state: '',
      zip: '',
    });
    setOpenWarning(false);
    setWarningMessage('');
  };

  const handleWarningClose = () => {
    setOpenWarning(false);
    setWarningMessage('');
  };

  useEffect(() => {
    const allFieldsFilled =
      numSlic.trim() &&
      alphaSlic.trim() &&
      address.street.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.zip.trim();

    if (!allFieldsFilled) {
      setOpenWarning(true);
      setWarningMessage('Please fill in all required fields.');
    } else {
      setOpenWarning(false);
      setWarningMessage('');
    }
  }, [numSlic, alphaSlic, address, type]);

  useEffect(() => {
    setSlicData({
      created_at: new Date().toISOString(),
      type,
      numSlic,
      alphaSlic,
      name,
      phone,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
      directions: null, // Assuming directions is not used in this form
    });
  }, [type, numSlic, alphaSlic, name, phone, address]);

  return (
    <FormContainer>
      <TypeRadio type={type} setType={setType} />
      <NumSlicField numSlic={numSlic} setNumSlic={setNumSlic} />
      <AlphaSlicField alphaSlic={alphaSlic} setAlphaSlic={setAlphaSlic} />
      <NameField name={name} setName={setName} />
      <PhoneField phone={phone} setPhone={setPhone} />
      <AddressFields address={address} setAddress={setAddress} />

      <FormActions handleClear={handleClear} slicData={slicData} />

      <Warning
        open={openWarning}
        message={warningMessage}
        onClose={handleWarningClose}
      />
    </FormContainer>
  );
}

export default NewSlicForm;
