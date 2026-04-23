# Campaign WhatsApp Chat Dashboard

A WhatsApp-style chat interface for managing campaign conversations, built with Next.js and Tailwind CSS.

## Features

- **WhatsApp-style UI**: Two-panel layout with contact list and chat conversation
- **Real-time Messaging**: Send and receive messages with instant UI updates
- **AI Toggle Control**: Enable/disable AI auto-replies per contact
- **Search & Filter**: Search contacts by name/phone, filter by AI status
- **Pagination**: Handle large conversation lists efficiently
- **Role-based Access**: Only accessible to admin users with public client_id
- **Responsive Design**: Works on desktop and mobile devices

## Access Control

The chat dashboard is only accessible when:
- User has admin/owner role (`canManageTeamFromToken()` returns true)
- Client ID is "public" (hardcoded for this implementation)

## API Integration

### Endpoints Used

1. **GET /campaign/sessions** - Fetch contact list with pagination
2. **GET /campaign/session** - Fetch conversation history
3. **POST /campaign/ai-reply-toggle** - Toggle AI auto-reply
4. **POST /campaign/unified-reply** - Send admin replies

### Authentication

All API calls use the `NEXT_PUBLIC_X_API_KEY` environment variable as the `X-API-Key` header.

## File Structure

```
src/app/(admin)/campaign-chat/
├── page.jsx                 # Main dashboard page
├── _components/
│   ├── ContactList.jsx      # Left panel - contact list
│   ├── ChatPanel.jsx        # Right panel - chat interface
│   └── MessageBubble.jsx    # Individual message component
├── test-api.jsx            # API testing utility
└── README.md               # This file
```

## Components

### ContactList
- Displays paginated list of conversations
- Shows contact name, phone number, message count
- AI status indicator (green dot for enabled)
- Search functionality
- AI filter (All/On/Off)

### ChatPanel
- Full conversation view
- AI toggle switch in header
- Message input with auto-resize
- Send button with loading state
- Auto-scroll to latest messages

### MessageBubble
- WhatsApp-style message bubbles
- Different styles for user vs AI messages
- Timestamp display
- URL detection and linking
- Avatar icons for user/AI

## Styling

Uses the existing design system:
- Primary color: `#E2DBFF` (purple theme)
- Tailwind CSS for styling
- Lucide React icons
- Consistent with admin dashboard design

## Usage

1. Navigate to `/campaign-chat` in the admin dashboard
2. The sidebar shows "Campaign Chat" menu item
3. Contact list loads on the left
4. Click a contact to view conversation
5. Toggle AI on/off using the switch
6. Type and send messages using the input

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_X_API_KEY=your_api_key_here
```

## Testing

Use the test API page at `/campaign-chat/test-api` to verify:
- API connectivity
- Authentication headers
- Response format
- Error handling

## Error Handling

- Access denied for non-admin users
- API error display with user-friendly messages
- Loading states for all async operations
- Network error handling with retry capability

## Performance Optimizations

- React Query for caching and background refetching
- Pagination for large conversation lists
- Optimistic UI updates for better UX
- Efficient re-rendering with proper dependencies

## Future Enhancements

- Real-time WebSocket updates
- File/image sharing
- Message templates
- Bulk operations
- Advanced filtering options
- Export functionality
