import SlicForm from '@/app/components/createEditSlic/SlicForm';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';

async function NewSlicPage() {
  return (
    <>
      <BackButton />
      <StyledHeading heading='h3'>New Slic</StyledHeading>

      <SlicForm />
      {/* <NewSlicForm /> */}
    </>
  );
}

export default NewSlicPage;
