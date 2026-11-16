'use client';

import { useMemo } from 'react';
import { CloseRounded } from '@mui/icons-material';
import { Autocomplete, Box, Button, Chip, TextField, Typography } from '@mui/material';

import { COMPOSE_EMAIL_FROM_NAME, COMPOSE_EMAIL_MAX_RECIPIENTS, CONTACT_EMAIL } from '@/constants';
import { isEmailAddress } from '@/lib/composedEmail';
import { softInputSx, softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';

// Who an email written on /admin/super/email goes to (ComposeEmail.jsx): any
// number of people, each getting their own copy. Pick accounts by name or
// email (`people`, from getEmailRecipients), type or paste addresses (a
// comma, a space or Enter ends one), or add a whole group with Everyone,
// Admins or Dispatch; pressing a group again takes it back out. `recipients`
// is the list of addresses; `inputValue` is what's typed but not yet a chip,
// which the form also sends when it's an address.

// Up to this many accounts listed at once; typing narrows them.
const PEOPLE_SHOWN = 50;
const SEPARATORS = /[\s,;]+/;

export const RECIPIENT_GROUP_BUTTONS = [
  { key: 'everyone', label: 'Everyone', match: () => true },
  { key: 'admins', label: 'Admins', match: (person) => person.role === 'admin' },
  { key: 'dispatch', label: 'Dispatch', match: (person) => person.role === 'dispatch' },
];

/** The group whose people are exactly these addresses, or null. */
export function groupOf(people, addresses) {
  if (!addresses.length) return null;
  const chosen = new Set(addresses);
  for (const group of RECIPIENT_GROUP_BUTTONS) {
    const members = people.filter(group.match).map((person) => person.email);
    if (members.length === chosen.size && members.every((email) => chosen.has(email))) return group.key;
  }
  return null;
}

export default function EmailRecipients({ people, recipients, setRecipients, inputValue, setInputValue, disabled }) {
  const byEmail = useMemo(() => new Map(people.map((person) => [person.email, person])), [people]);
  const emails = useMemo(() => people.map((person) => person.email), [people]);
  const groups = useMemo(
    () =>
      RECIPIENT_GROUP_BUTTONS.map((group) => ({
        ...group,
        members: people.filter(group.match).map((person) => person.email),
      })),
    [people],
  );

  const add = (addresses) => {
    const clean = addresses.map((address) => address.trim().toLowerCase()).filter(Boolean);
    setRecipients((current) => [...current, ...clean.filter((address) => !current.includes(address))]);
  };

  const toggleGroup = (group) => {
    const all = group.members.length && group.members.every((email) => recipients.includes(email));
    if (all) setRecipients((current) => current.filter((email) => !group.members.includes(email)));
    else add(group.members);
  };

  const filterOptions = (options, { inputValue: typed }) => {
    const query = typed.trim().toLowerCase();
    const open = options.filter((email) => !recipients.includes(email));
    const found = query
      ? open.filter((email) => email.includes(query) || (byEmail.get(email)?.name ?? '').toLowerCase().includes(query))
      : open;
    return found.slice(0, PEOPLE_SHOWN);
  };

  const single = recipients.length === 1 && !inputValue.trim() ? byEmail.get(recipients[0]) : null;
  const over = recipients.length > COMPOSE_EMAIL_MAX_RECIPIENTS;
  const helper = over
    ? `${recipients.length} people. One email goes to ${COMPOSE_EMAIL_MAX_RECIPIENTS} at most: Resend’s free plan sends 100 a day, password and sign-up emails included.`
    : recipients.length > 1
      ? `${recipients.length} people, each getting their own copy from ${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>. Nobody sees the others.`
      : single?.name
        ? `To ${single.name}, from ${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>. Replies come back to that inbox.`
        : `From ${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>. Replies come back to that inbox.`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Autocomplete
        multiple
        freeSolo
        filterSelectedOptions
        options={emails}
        value={recipients}
        onChange={(_event, value) => {
          const next = [];
          for (const item of value) {
            for (const part of String(item).split(SEPARATORS)) {
              const address = part.trim().toLowerCase();
              if (address && !next.includes(address)) next.push(address);
            }
          }
          setRecipients(next);
        }}
        inputValue={inputValue}
        onInputChange={(_event, value, reason) => {
          if (reason === 'reset') return setInputValue('');
          // A pasted list, or an address ended with a comma or a space,
          // becomes chips; the last piece stays typed.
          if (reason === 'input' && SEPARATORS.test(value)) {
            const parts = value.split(SEPARATORS);
            const last = parts.pop();
            add(parts);
            return setInputValue(last);
          }
          setInputValue(value);
        }}
        filterOptions={filterOptions}
        getOptionLabel={(email) => email}
        limitTags={6}
        getLimitTagsText={(more) => `+${more} more`}
        disabled={disabled}
        noOptionsText='No account with that name or email. Press Enter to send to it anyway.'
        renderOption={({ key, ...props }, email) => (
          <Box component='li' key={key} {...props} sx={{ minHeight: '3rem' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                {byEmail.get(email)?.name || 'No name'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
                {email}
              </Typography>
            </Box>
          </Box>
        )}
        renderValue={(value, getItemProps) =>
          value.map((email, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            const name = byEmail.get(email)?.name;
            const valid = isEmailAddress(email);
            return (
              <Chip
                key={key}
                {...itemProps}
                size='small'
                label={name || email}
                title={email}
                color={valid ? 'default' : 'error'}
                deleteIcon={<CloseRounded aria-label={`Remove ${name || email}`} />}
                sx={[softRaisedSmall, { maxWidth: '100%' }]}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            sx={softInputSx}
            label='To'
            required={!recipients.length}
            error={over}
            placeholder={recipients.length ? 'Add someone' : 'Pick people, or type addresses'}
            helperText={helper}
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.inputProps,
                maxLength: 254,
                autoCapitalize: 'none',
                spellCheck: false,
                autoComplete: 'off',
                inputMode: 'email',
              },
            }}
          />
        )}
      />

      <Box role='group' aria-label='Add a group' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {groups.map((group) => {
          const all = group.members.length > 0 && group.members.every((email) => recipients.includes(email));
          return (
            <Chip
              key={group.key}
              component='button'
              type='button'
              clickable
              aria-pressed={all}
              disabled={disabled || !group.members.length}
              onClick={() => toggleGroup(group)}
              label={`${group.label} (${group.members.length})`}
              sx={[softToggleSx, { minHeight: '2.75rem', borderRadius: 999, px: 0.5 }]}
            />
          );
        })}
        {recipients.length ? (
          <Button
            type='button'
            onClick={() => setRecipients([])}
            disabled={disabled}
            sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
          >
            Clear
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
