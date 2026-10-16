'use client';

import {
  AdminPanelSettingsOutlined,
  LocalCafeOutlined,
  MonitorHeartOutlined,
  NotificationsOutlined,
  TimelineOutlined,
  ToggleOnOutlined,
} from '@mui/icons-material';
import { Alert, Box } from '@mui/material';

import ActivityList from './ActivityList';
import HubCard from './HubCard';
import HubSection from './HubSection';
import HubTiles from './HubTiles';
import TopSlics from './TopSlics';
import UsageCharts from './UsageCharts';
import { formatDay, formatMoney, formatWhen, plural } from './format';

const failed = (what) => <Alert severity='error'>Couldn&apos;t load {what}. Try again in a moment.</Alert>;

function cards({ notifications, activity, health, features, admins, support, members }) {
  const problems = health?.sections.filter((section) => section.status === 'error' || section.status === 'warning') ?? [];
  const latest = activity?.rows[0];
  return [
    {
      href: '/admin/super/notifications',
      icon: <NotificationsOutlined />,
      title: 'Notifications',
      ...(notifications
        ? {
            status: !notifications.configured ? 'error' : notifications.openFailed > 0 ? 'warning' : 'ok',
            statusWord: !notifications.configured
              ? 'Keys not set'
              : notifications.openFailed > 0
                ? `${notifications.openFailed} failed ${notifications.cleared ? 'since cleared' : 'this week'}`
                : 'Sending normally',
            lines: [
              `${plural(notifications.adminsOn, 'admin')} with a device · ${plural(notifications.devices, 'device')}`,
              ...(notifications.driversOn ? [`${plural(notifications.driversOn, 'driver')} with a device`] : []),
              `${plural(notifications.sentWeek, 'send')} this week`,
            ],
          }
        : { lines: ['Couldn’t load the summary.'] }),
    },
    {
      href: '/admin/super/activity',
      icon: <TimelineOutlined />,
      title: 'Activity',
      lines: latest
        ? [`Latest, ${formatWhen(latest.at)}:`, latest.text.length > 90 ? `${latest.text.slice(0, 89)}…` : latest.text]
        : ['Everything happening in the app, newest first.'],
    },
    {
      href: '/admin/super/health',
      icon: <MonitorHeartOutlined />,
      title: 'System health',
      ...(health
        ? {
            status: health.status === 'info' ? 'ok' : health.status,
            statusWord: problems.length === 0 ? 'Everything checks out' : `${problems.length} to look at`,
            lines: problems.length ? [problems.map((section) => section.title).join(', ')] : ['Sheet sync, keys, push, indexes and more.'],
          }
        : { lines: ['Couldn’t run the checks.'] }),
    },
    {
      href: '/admin/super/features',
      icon: <ToggleOnOutlined />,
      title: 'Features',
      lines: features
        ? [
            `Covers: ${features.coversOpen ? 'every driver' : 'admins only (testing)'}`,
            `Notifications: ${features.pushOpen ? 'every driver' : 'admins only (testing)'}`,
            new Date().toISOString() < features.placesNewUntil
              ? `Places says “New” until ${formatDay(features.placesNewUntil)}`
              : 'Places “New” label ended',
          ]
        : ['Couldn’t load the switches.'],
    },
    {
      href: '/admin/super/admins',
      icon: <AdminPanelSettingsOutlined />,
      title: 'Admins',
      lines: admins
        ? [
            `${plural(admins.admins, 'admin')}, ${admins.superAdmins} super${admins.dispatch ? `, ${admins.dispatch} dispatch` : ''}`,
            'Roles, the tools each can use, and what each has done.',
          ]
        : ['Roles, the tools each can use, and what each has done.'],
    },
    {
      href: '/admin/super/supporters',
      icon: <LocalCafeOutlined />,
      title: 'Supporters',
      lines: [
        support
          ? support.totals.length
            ? `${support.totals.map((row) => formatMoney(row.total, row.currency)).join(' + ')} in 30 days (${plural(support.count, 'support')})`
            : 'No support in the last 30 days'
          : null,
        typeof members === 'number' ? plural(members, 'member') : null,
      ],
    },
  ];
}

// The super admin hub, /admin/super (docs/SUPER-ADMIN-HUB.md): the app at a
// glance, a card for each place to manage it, usage over time, and the latest
// activity. Each part is `null` when it failed to load, and says so in place.
export default function HubView({ glance, usage, notifications, activity, health, features, admins, support }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <HubSection id='hub-glance' title='At a glance'>
        {glance ? <HubTiles numbers={glance} /> : failed('the numbers')}
      </HubSection>

      <HubSection id='hub-manage' title='Manage'>
        <Box
          component='ul'
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 2, sm: 2.5 },
          }}
        >
          {cards({ notifications, activity, health, features, admins, support, members: glance?.members }).map(
            (card, index) => (
              <HubCard key={card.href} index={index} {...card} />
            ),
          )}
        </Box>
      </HubSection>

      <HubSection id='hub-usage' title='Usage'>
        {usage ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
            <UsageCharts usage={usage} />
            <TopSlics slics={usage.topSlics} />
          </Box>
        ) : (
          failed('the usage charts')
        )}
      </HubSection>

      <HubSection
        id='hub-activity'
        title='Latest activity'
        action={{ href: '/admin/super/activity', label: 'See all' }}
      >
        {activity ? <ActivityList rows={activity.rows} /> : failed('the activity')}
      </HubSection>
    </Box>
  );
}
