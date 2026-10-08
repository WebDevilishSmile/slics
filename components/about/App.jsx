import AboutSection from './AboutSection';

export default function App() {
  return (
    <AboutSection
      title='The App'
      imageSrc='/slics-logo.png'
      imageAlt='SLICs App'
    >
      SLICs is a web app built for UPS Feeder drivers to quickly look up
      destination addresses, phone numbers, and other details while on the
      road. It was designed so drivers can access the information they need
      without having to dig through a binder or type in an address manually.
      After I added all the UPS hubs and also added all the PDFs for the
      SLICs, I realized that the app could provide the addresses for the
      customers we go to as well. This takes a bit more work because the
      addresses are constantly changing. I have to keep track of which SLICs
      are being updated and which are new.
    </AboutSection>
  );
}
