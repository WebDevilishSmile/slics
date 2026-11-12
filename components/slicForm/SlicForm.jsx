'use client';

import { useState } from 'react';
import AddressFields from './AddressFields';
import AlphaSlicField from './AlphaSlicField';
import FormActions from './FormActions';
import FormContainer from './FormContainer';
import NameField from './NameField';
import NumSlicField from './NumSlicField';
import PhoneField from '@/components/form/PhoneField';
import TypeRadio from './TypeRadio';
import PdfUpload from './PdfUpload';
import ArrivalField from './ArrivalField';
import RouteEditor from './RouteEditor';
import SlicDocuments from './SlicDocuments';
import { slicPdfHref } from '@/constants';
import { softInputSx } from '@/components/utility/soft';

export default function SlicForm({
  initialData = null,
  mode = 'create', // 'create' or 'edit'
  onSubmit,
  reportId, // a driver report this edit fixes (app/admin/edit/[slic]/page.jsx)
  route = null, // the SLIC's route, edit mode only (lib/serializers.js toAdminRoute)
  documents = [], // its photos and PDFs, edit mode only (toAdminDocument)
}) {
  const [type, setType] = useState(initialData?.type || 'center');
  const [numSlic, setNumSlic] = useState(initialData?.numSlic || '');
  const [alphaSlic, setAlphaSlic] = useState(initialData?.alphaSlic || '');
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(
    initialData?.address || { street: '', city: '', state: '', zip: '' }
  );
  const [arrival, setArrival] = useState(initialData?.arrival || '');

  const handleClear = () => {
    setType('center');
    setNumSlic('');
    setAlphaSlic('');
    setName('');
    setPhone('');
    setAddress({ street: '', city: '', state: '', zip: '' });
    setArrival('');
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
    arrival: arrival.trim() || null,
    // `pdfUrl` is deliberately not here: PdfUpload writes it through its own
    // route, so a form Update never overwrites a PDF attached mid-edit.
  };

  // Checked when Save is pressed (FormActions), not as the admin types: a
  // new, empty form shouldn't open on a warning.
  const isComplete = [
    numSlic,
    alphaSlic,
    address.street,
    address.city,
    address.state,
    address.zip,
  ].every((value) => value?.toString().trim());

  return (
    <FormContainer>
      <TypeRadio type={type} setType={setType} />
      <NumSlicField
        numSlic={numSlic}
        setNumSlic={setNumSlic}
        readOnly={mode === 'edit'}
      />
      <AlphaSlicField alphaSlic={alphaSlic} setAlphaSlic={setAlphaSlic} />
      <NameField name={name} setName={setName} />
      <PhoneField phone={phone} setPhone={setPhone} sx={softInputSx} />
      <AddressFields address={address} setAddress={setAddress} />
      <ArrivalField arrival={arrival} setArrival={setArrival} />
      {mode === 'edit' && (
        <>
          {/* The route and the PDF save on their own, not with Update. */}
          <RouteEditor
            numSlic={initialData?.numSlic}
            route={route}
            pdfHref={initialData ? slicPdfHref(initialData) : null}
          />
          <SlicDocuments slicId={initialData?._id} documents={documents} />
          <PdfUpload slicId={initialData?._id} pdfUrl={initialData?.pdfUrl} />
        </>
      )}

      <FormActions
        handleClear={handleClear}
        slicData={slicData}
        slicId={initialData?._id}
        onSubmit={onSubmit}
        mode={mode}
        isComplete={isComplete}
        reportId={reportId}
      />
    </FormContainer>
  );
}
