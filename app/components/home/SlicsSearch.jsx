'use client';

import {
  HubOutlined,
  LocalCafeOutlined,
  SearchOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { readRecentLookups } from '@/utils/recentLookups';
import { BMC_URL } from '@/utils/variables';
import SoftNotice from '../utility/SoftNotice';
import { softFocus, softSurface } from '../utility/soft';

function getDonationMessage(count) {
  if (count <= 0) return null;
  if (count <= 5) return `Enjoying SLICs? Help keep it free!`;
  if (count <= 20)
    return `You've looked up ${count} slics — consider supporting us!`;
  if (count <= 50)
    return `You're a power user! ${count} lookups and counting — your support helps keep SLICs free.`;
  return `${count} lookups! SLICs runs on community support — thank you for being here.`;
}

const labelFor = (slic) =>
  slic.type === 'customer'
    ? `${slic.numSlic} - ${slic.name} - ${slic.alphaSlic}`
    : `${slic.numSlic} - ${slic.alphaSlic}`;

// The search is a raised pill in the page's own surface, seamless like the
// panels (CLAUDE.md, "Visual style"), that presses in while you type.
const searchSx = (theme) => {
  const raised = theme.soft.raisedSmall;
  return {
    width: '100%',
    maxWidth: theme.layout.width.panel,
    mt: 3,
    '& .MuiOutlinedInput-root': {
      ...softSurface(theme),
      borderRadius: 999,
      minHeight: '3.25rem',
      pl: 2,
      boxShadow: raised.light,
      transition: theme.transitions.create('box-shadow', {
        duration: theme.transitions.duration.short,
      }),
      ...theme.applyStyles('dark', { boxShadow: raised.dark }),
      '&.Mui-focused': {
        ...softFocus(theme),
      },
    },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  };
};

// The dropdown, in the same soft surface, with roomy rows for a thumb.
const listSx = (theme) => ({
  mt: 1,
  borderRadius: 4,
  ...softSurface(theme),
  boxShadow: theme.soft.raised.light,
  ...theme.applyStyles('dark', { boxShadow: theme.soft.raised.dark }),
  '& .MuiAutocomplete-option': { minHeight: '3rem' },
});


// One option per SLIC: centers lead with their alpha code, customers with
// their name, as on the lookup card (#40). `label` is what the input shows
// once picked; `search` is what typing matches (it starts with the label, so
// re-searching the picked text still finds it).
//
// Every field is coerced to a string: some SLICs store `alphaSlic` as a number
// (e.g. 1075), and Highlight's toLowerCase on a number crashed the page as
// soon as the list opened.
const text = (value) => (value === null || value === undefined ? '' : String(value));

const toOption = (slic) => {
  const isCustomer = slic.type === 'customer';
  const numSlic = text(slic.numSlic);
  return {
    numSlic,
    type: isCustomer ? 'customer' : 'center',
    title: text(isCustomer ? slic.name : slic.alphaSlic) || `SLIC ${numSlic}`,
    subtitle: [`SLIC ${numSlic}`, isCustomer ? text(slic.alphaSlic) : '', text(slic.address?.city)]
      .filter(Boolean)
      .join(' · '),
    label: labelFor(slic),
    search: [labelFor(slic), text(slic.name), text(slic.address?.city)]
      .filter(Boolean)
      .join(' '),
    group: 'All SLICs',
  };
};

const filterAll = createFilterOptions({ stringify: (option) => option.search });

// Bolds the first case-insensitive match of `query` in `text` (#42).
function Highlight({ text: value, query }) {
  const text = String(value ?? '');
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <Box component='mark' sx={{ bgcolor: 'transparent', color: 'primary.main', fontWeight: 800 }}>
        {text.slice(index, index + query.length)}
      </Box>
      {text.slice(index + query.length)}
    </>
  );
}

// The support notice can be dismissed for 30 days (#42), like the install
// nudge: it used to sit above the search on every visit.
const DONATION_KEY = 'slics-donation-dismissed';
const DONATION_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

const donationSnoozed = () => {
  try {
    const at = Date.parse(localStorage.getItem(DONATION_KEY) ?? '');
    return Date.now() - at < DONATION_SNOOZE_MS;
  } catch {
    return false;
  }
};

// The SLIC search (UI-SUGGESTIONS.md #42). Focus it and this device's recent
// lookups come first under "Recent" (utils/recentLookups.js); type and every
// SLIC matches on number, code, name or city, with the match highlighted.
// Enter takes the top match. `onSelect(numSlic | null)` shows the pick at
// once (home/Main.jsx); the URL follows through router.push so Back and
// sharing still work.
function SlicsSearch({ slics, onSelect, viewCount, isMember }) {
  const [selected, setSelected] = useState(null);
  const [inputValue, setInputValue] = useState('');
  // True once the driver types; picking or clearing resets it.
  const [typed, setTyped] = useState(false);
  const [recentNums, setRecentNums] = useState([]);
  // Hidden until storage is read, so a dismissed notice never flashes.
  const [donationHidden, setDonationHidden] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = useMemo(() => slics.map(toOption), [slics]);
  const byNum = useMemo(
    () => new Map(options.map((option) => [option.numSlic, option])),
    [options],
  );
  const recentOptions = recentNums
    .map((num) => byNum.get(num))
    .filter(Boolean)
    .map((option) => ({ ...option, group: 'Recent' }));

  useEffect(() => setDonationHidden(donationSnoozed()), []);
  const donationMessage =
    isMember || donationHidden ? null : getDonationMessage(viewCount);

  const dismissDonation = () => {
    setDonationHidden(true);
    try {
      localStorage.setItem(DONATION_KEY, new Date().toISOString());
    } catch {
      // Storage blocked: it just comes back next visit.
    }
  };

  const handleSlicChange = (event, value) => {
    setSelected(value);
    onSelect?.(value?.numSlic ?? null);
    router.push(value ? `${pathname}?slic=${value.numSlic}` : pathname);
  };

  useEffect(() => {
    const initialSlic = searchParams.get('slic');
    if (!initialSlic) return setSelected(null);
    const slic = slics.find(
      (s) => s.numSlic === initialSlic || s.alphaSlic === initialSlic,
    );
    if (slic) setSelected(byNum.get(String(slic.numSlic)) ?? null);
  }, [searchParams, slics, byNum]);

  // Before any typing: recents first, then everything. While typing: matches
  // only, ungrouped, so a recent SLIC isn't listed twice.
  const showRecent = !typed && recentOptions.length > 0;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {donationMessage && (
        <SoftNotice
          icon={<LocalCafeOutlined />}
          onClose={dismissDonation}
          closeLabel='Hide for 30 days'
          sx={{ mt: 3 }}
          actions={
            <>
              <Button size='small' href={BMC_URL} target='_blank' rel='noopener noreferrer'>
                Buy Me a Coffee
              </Button>
              <Button
                size='small'
                href={`${BMC_URL}/membership`}
                target='_blank'
                rel='noopener noreferrer'
              >
                Become a member
              </Button>
            </>
          }
        >
          {donationMessage}
        </SoftNotice>
      )}
      <Autocomplete
        fullWidth
        openOnFocus
        autoHighlight
        options={options}
        value={selected}
        inputValue={inputValue}
        onInputChange={(event, value, reason) => {
          setInputValue(value);
          // MUI also fills the input with a picked label (reason 'reset');
          // only real typing counts as a search.
          setTyped(reason === 'input' && value !== '');
        }}
        onOpen={() => setRecentNums(readRecentLookups().map((r) => r.numSlic))}
        onChange={handleSlicChange}
        filterOptions={(all, state) =>
          state.inputValue
            ? filterAll(all, state)
            : showRecent
              ? [...recentOptions, ...all]
              : all
        }
        groupBy={showRecent ? (option) => option.group : undefined}
        getOptionLabel={(option) => option.label}
        getOptionKey={(option) => `${option.group}-${option.numSlic}`}
        isOptionEqualToValue={(option, value) => option.numSlic === value.numSlic}
        renderGroup={(params) => (
          <li key={params.key}>
            <Typography
              variant='overline'
              color='text.secondary'
              sx={{ display: 'block', px: 2, pt: 1 }}
            >
              {params.group}
            </Typography>
            <Box component='ul' sx={{ p: 0 }}>
              {params.children}
            </Box>
          </li>
        )}
        renderOption={(props, option, { inputValue: query }) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                {option.type === 'customer' ? (
                  <StorefrontOutlined sx={{ color: 'primary.main' }} />
                ) : (
                  <HubOutlined sx={{ color: 'primary.main' }} />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    <Highlight text={option.title} query={query} />
                  </Typography>
                  <Typography variant='body2' color='text.secondary' noWrap>
                    <Highlight text={option.subtitle} query={query} />
                  </Typography>
                </Box>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder='SLIC, code or name'
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.inputProps, 'aria-label': 'Search SLICs' },
              input: {
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchOutlined sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
        slotProps={{ paper: { sx: listSx } }}
        sx={searchSx}
      />
    </Box>
  );
}

export default SlicsSearch;
