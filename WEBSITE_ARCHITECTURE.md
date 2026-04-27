# Website Architecture Summary

## Routing & Navigation
- **Framework**: Next.js 16.2.4 with App Router (`/app/(admin)/`)
- **Client-side routing**: `useRouter` and `usePathname` from `next/navigation`
- **Sidebar navigation**: Dynamic links with client ID prefix support
- **URL params**: Used for filter persistence (city, developer)

## Caching Strategy
- **React Query**: Singleton pattern for QueryClient across navigation
- **Cache duration**: 15 min staleTime, 30 min gcTime (projects, developers, units)
- **No refetch on window focus**: Prevents unnecessary API calls
- **Filter persistence**: URL query params maintain state across tabs

## Sidebar
- **Components**: `/components/dashbord/common/Sidebar.jsx`
- **Tabs**: Projects, Developers, Units, Dashboard, Campaigns, Calendar, Analytics, News, Map
- **Navigation**: Uses `Link` from Next.js with client ID prefix
- **State**: `isPending` for transition states, pending path tracking

## Tab Contents
- **Projects**: Paginated project list with city/developer filters, CRUD operations, phases management
- **Developers**: Infinite scroll developer list with details view
- **Units**: Filterable units with search params, pagination
- **Dashboard**: Lead management, split view, analytics
- **Campaigns**: Campaign management with chat integration
- **Calendar**: Event scheduling and management

## Key Features
- **Authentication**: Token refresh with 1-min interval, 5-min refresh threshold
- **Internationalization**: I18n provider with Arabic/English support
- **Permissions**: Module-based access control (broker permissions)
- **Data persistence**: Filters in URL, data in React Query cache
