# Timezone Debugging Guide

## Issue Summary

- Time always shows as 7 PM (regardless of selection)
- Date is off by 1 day (tomorrow shows as today)

## Root Cause Analysis

### Theory: Google Tasks API Date Storage

The 7 PM issue is suspicious. In Central Time (UTC-5):

- **Midnight UTC** = 7 PM CDT (previous day)
- This suggests we're saving `00:00:00Z` (midnight UTC)

### Debugging Steps

#### Step 1: Check what's being sent to Google Tasks

Add temporary console logging:

```typescript
// In ScheduleWebViewProvider.ts, setupWebViewMessageHandling:
case 'schedule':
  console.log('WebView sending:', {
    date: message.date,
    time: message.time,
    recurring: message.recurring
  })
  
  const [hours, minutes] = message.time.split(':').map(Number)
  const [year, month, day] = message.date.split('-').map(Number)
  console.log('Parsed values:', { year, month, day, hours, minutes })
  
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
  console.log('Local Date:', localDate.toString())
  
  const dueRFC3339 = localDate.toISOString()
  console.log('RFC3339 being saved:', dueRFC3339)
```

#### Step 2: Check what Google Tasks returns

After saving, edit the task again and check:

```typescript
// In getWebViewContent:
if (task?.due) {
  console.log('Google Tasks returned due:', task.due)
  const dueDate = new Date(task.due)
  console.log('Parsed as Date:', dueDate.toString())
  console.log('Hours:', dueDate.getHours(), 'Minutes:', dueDate.getMinutes())
}
```

#### Step 3: Verify Firefox/Browser Console

1. Press **F12** in VSCode (or Ctrl+Shift+I)
2. Go to **Console** tab
3. Set a schedule and check the logs
4. Look for the RFC3339 value being saved

## Expected Values

### Example: Tomorrow @ 4 PM (from Oct 20, 2025)

**WebView Input:**

- date: `2025-10-21`
- time: `16:00`

**Timezone Conversion (Central CDT):**

- Local time: Oct 21, 2025 @ 4:00 PM CDT
- UTC time: Oct 21, 2025 @ 9:00 PM UTC

**RFC3339 String:**

```
2025-10-21T21:00:00.000Z
```

**When Read Back (Central Timezone):**

- Timestamp represents: Oct 21 @ 9 PM UTC
- Displayed as: Oct 21 @ 4 PM CDT ✅

### If Getting 7 PM (Wrong)

**Actual RFC3339 Saved:**

```
2025-10-21T00:00:00.000Z  ❌ (midnight UTC)
```

**When Read Back:**

- Timestamp represents: Oct 21 @ midnight UTC
- Displayed as: Oct 20 @ 7 PM CDT ❌

This would explain both issues!

## Possible Fixes

### Option A: Google Tasks API Issue

If Google Tasks API only stores the DATE (not time), we need to handle it differently:

```typescript
// Check if due field only has date
if (task.due && task.due.indexOf('T') === -1) {
  // Only date, no time - handle specially
  const dueDate = new Date(task.due + 'T09:00:00.000Z')
}
```

### Option B: Browser Timezone Not Being Detected

If the system timezone isn't being detected correctly:

```typescript
// Check actual timezone offset
const offset = new Date().getTimezoneOffset()
console.log('Timezone offset (minutes):', offset)
console.log('Timezone offset (hours):', offset / 60)
// Should be 300 (or 5 hours) for Central
```

### Option C: HTML Input Value Format Issue

The time input might not be returning expected format:

```typescript
// In saveSchedule():
const time = document.getElementById('timeInput').value
console.log('Raw time value:', time, 'Type:', typeof time)
// Should be "16:00" for 4 PM
```

## Action Items

1. **Check the browser console** for what's actually being sent/received
2. **Verify RFC3339 format** is being generated correctly
3. **Test with hardcoded values** (temporarily hardcode tomorrow @ 4 PM to see if it works)
4. **Check Google Tasks API documentation** for date field requirements

## Commands for Testing

```bash
# Build and watch for changes
npm run watch

# Build once
npm run compile

# Run tests (if available)
npm test
```

---

**Note:** The issue is most likely that we're saving midnight UTC (`00:00:00Z`) instead of the actual time selected. Check the RFC3339 values in the browser console to confirm.
