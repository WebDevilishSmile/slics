import theme from '@/theme';
import { Alert, FormControl, TextField } from '@mui/material';
import { softInputSx } from '@/components/utility/soft';
import { ARRIVAL_MAX_LENGTH, mentionsCode } from '@/lib/routeText';

// The SLIC's arrival notes (`slics.arrival`, docs/SLIC-DIRECTIONS.md): gates,
// doors, check-in, weekend rules. They're the destination's, the same from
// any hub, so they live on the SLIC and save with the form. Drivers see them
// under "Getting in" in the directions sheet.
function ArrivalField({ arrival, setArrival }) {
  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4, gap: 1.5 }}>
      <TextField
        label='Arrival notes (Getting in)'
        value={arrival}
        onChange={(event) => setArrival(event.target.value)}
        multiline
        minRows={3}
        placeholder='e.g. Use the second entrance. On weekends the main gate is locked: use the back guard shack.'
        helperText={`Gates, doors, check-in: the same from any hub. ${arrival.length}/${ARRIVAL_MAX_LENGTH}`}
        slotProps={{ htmlInput: { maxLength: ARRIVAL_MAX_LENGTH } }}
        sx={softInputSx}
      />
      {mentionsCode(arrival) && (
        <Alert severity='warning'>
          This looks like it has a gate code. Every signed-in driver can read these notes, so
          leave codes out.
        </Alert>
      )}
    </FormControl>
  );
}

export default ArrivalField;
