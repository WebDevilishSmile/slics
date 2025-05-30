'use client';

import { useEffect, useState } from 'react';
import FormContainer from '../newSlic/FormContainer';
import TypeRadio from '../newSlic/TypeRadio';
import NumSlicField from '../newSlic/NumSlicField';
import AlphaSlicField from '../newSlic/AlphaSlicField';
import NameField from '../newSlic/NameField';
import PhoneField from '../newSlic/PhoneField';
import AddressFields from '../newSlic/AddressFields';
import FormActions from '../newSlic/FormActions';
import Warning from '../newSlic/Warning';
import dayjs from 'dayjs';

export default function SlicForm({
  initialData = null,
  mode = 'create', // 'create' or 'edit'
  onSubmit,
}) {
  const [type, setType] = useState(initialData?.type || 'center');
  const [numSlic, setNumSlic] = useState(initialData?.numSlic || '');
  const [alphaSlic, setAlphaSlic] = useState(initialData?.alphaSlic || '');
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(
    initialData?.address || { street: '', city: '', state: '', zip: '' }
  );

  const [openWarning, setOpenWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const handleClear = () => {
    setType('center');
    setNumSlic('');
    setAlphaSlic('');
    setName('');
    setPhone('');
    setAddress({ street: '', city: '', state: '', zip: '' });
    setOpenWarning(false);
    setWarningMessage('');
  };

  const handleWarningClose = () => {
    setOpenWarning(false);
    setWarningMessage('');
  };

  const slicData = {
    created_at: initialData?.created_at || new Date().toISOString(),
    type,
    numSlic,
    alphaSlic,
    name,
    phone,
    address,
    directions: initialData?.directions || null,
  };

  useEffect(() => {
    const allFieldsFilled =
      numSlic?.toString().trim() &&
      alphaSlic?.toString().trim() &&
      address.street?.toString().trim() &&
      address.city?.toString().trim() &&
      address.state?.toString().trim() &&
      address.zip?.toString().trim();

    if (!allFieldsFilled) {
      setOpenWarning(true);
      setWarningMessage('Please fill in all required fields.');
    } else {
      setOpenWarning(false);
      setWarningMessage('');
    }
  }, [numSlic, alphaSlic, address]);

  return (
    <FormContainer>
      <TypeRadio type={type} setType={setType} />
      <NumSlicField numSlic={numSlic} setNumSlic={setNumSlic} />
      <AlphaSlicField alphaSlic={alphaSlic} setAlphaSlic={setAlphaSlic} />
      <NameField name={name} setName={setName} />
      <PhoneField phone={phone} setPhone={setPhone} />
      <AddressFields address={address} setAddress={setAddress} />

      <FormActions
        handleClear={handleClear}
        slicData={slicData}
        onSubmit={onSubmit}
        mode={mode}
      />

      <Warning
        open={openWarning}
        message={warningMessage}
        onClose={handleWarningClose}
      />
    </FormContainer>
  );
}
