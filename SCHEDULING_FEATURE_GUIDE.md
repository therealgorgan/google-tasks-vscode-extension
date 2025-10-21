# Google Tasks Scheduling Feature - Implementation Guide

## ✅ What's Been Implemented

You now have **full scheduling support** for Google Tasks with:

### Features Added

1. **Display Due Dates** - Tasks now show their scheduled date/time in the tree view
   - Format: `📅 Oct 20, 2:00 PM` or `📅 Tomorrow @ 3:00 PM`
   - Shows "(daily)", "(weekly)", etc. if recurring
   - Automatically detects relative dates (Today, Tomorrow)

2. **Set Task Schedule** - New command to add a schedule to any task
   - Interactive date picker with presets: Today, Tomorrow, Next Week, Next Month, This Weekend
   - Custom date input supporting: YYYY-MM-DD or MM/DD/YYYY
   - Time picker with presets: 9 AM, 12 PM, 2 PM, 5 PM, 9 PM
   - Custom time input supporting: 12-hour (2:30 PM) or 24-hour (14:30) format
   - Recurrence options: Daily, Weekly, Bi-weekly, Monthly, Yearly

3. **Edit Task Schedule** - Modify existing task schedules
   - Only appears for tasks that already have a due date
   - Same full dialog as setting schedules

4. **Clear Task Schedule** - Remove schedule from a task
   - Only appears for scheduled tasks
   - Confirmation dialog to prevent accidental deletion

### New Files Created

- `src/app/utils/DateTimeUtils.ts` - Date/time formatting and RFC 3339 conversion utilities
- `src/app/utils/ScheduleDialog.ts` - Interactive UI for schedule selection

### Modified Files

- `src/app/TreeDataProviders/GTask/GTask.treeItem.ts` - Enhanced to display due dates in task description
- `src/app/commands/commands.ts` - Added 3 new scheduling commands
- `package.json` - Registered new commands and menu items
- `tsconfig.json` - Updated to include ES2017 lib for modern string methods

### New Icons

- `resources/dark-icon-schedule.svg` - Set schedule icon (dark theme)
- `resources/light-icon-schedule.svg` - Set schedule icon (light theme)
- `resources/dark-icon-edit-schedule.svg` - Edit schedule icon (dark theme)
- `resources/light-icon-edit-schedule.svg` - Edit schedule icon (light theme)
- `resources/dark-icon-clear-schedule.svg` - Clear schedule icon (dark theme)
- `resources/light-icon-clear-schedule.svg` - Clear schedule icon (light theme)

## 📋 How to Use

### In VSCode Tree View

1. **Right-click any task** to see the context menu
2. **Select "Set Task Schedule"** (or "Edit Task Schedule" if already scheduled)
3. **Choose a date:**
   - Pick a preset (Today, Tomorrow, Next Week, etc.)
   - Or select "Custom Date" and enter in YYYY-MM-DD format
4. **Choose a time:**
   - Pick a preset (9 AM, 2 PM, etc.)
   - Or select "Custom Time" and enter in 12-hour or 24-hour format
   - Or choose "No specific time" for all-day tasks
5. **Choose recurrence (optional):**
   - Select from Daily, Weekly, Bi-weekly, Monthly, Yearly
   - Or "No recurrence" for one-time tasks

### After Setting Schedule

- The task description will show: `📅 Tomorrow @ 3:00 PM (weekly)`
- You can **edit** the schedule by right-clicking and selecting "Edit Task Schedule"
- You can **remove** the schedule by right-clicking and selecting "Clear Task Schedule"

## 🔧 Next Steps / Future Enhancements

### Optional Improvements

1. **Visual Indicators:**
   - Add colored backgrounds for overdue tasks
   - Highlight tasks scheduled for today
   - Add task status icons

2. **Advanced Recurrence:**
   - Custom recurrence patterns (every 2 weeks, etc.)
   - Recurrence end dates
   - Days of week selection for weekly recurring tasks

3. **Notifications:**
   - Desktop notifications for upcoming tasks
   - VSCode status bar indicator for tasks due today

4. **Sorting & Filtering:**
   - Sort tasks by due date
   - Filter by scheduled/unscheduled tasks
   - Show overdue tasks at the top

5. **Bulk Operations:**
   - Set schedule for multiple tasks at once
   - Copy schedule from one task to another

### Data Storage

Currently, the extension stores:

- **Due Date/Time** in the `due` field (Google Tasks API standard)
- **Recurrence Pattern** in the task description (can be improved with extended properties)

## ⚙️ Technical Details

### Google Tasks API Integration

The scheduling feature uses the Google Tasks API v1 `due` field:

- Format: RFC 3339 (ISO 8601) - e.g., `"2025-10-20T14:00:00.000Z"`
- Updated via `tasks.patch()` method
- Stored on Google's servers automatically

### Code Architecture

**DateTimeUtils.ts:**

- Converts between Date objects and RFC 3339 strings
- Formats dates for human-readable display
- Parses user input in various formats
- Provides time/date presets

**ScheduleDialog.ts:**

- Shows interactive quick-pick dialogs
- Guides users through date → time → recurrence selection
- Validates all user input
- Shows helpful error messages

**GTask.treeItem.ts:**

- Displays formatted schedule info in task description
- Sets context values for menu visibility

**commands.ts:**

- Orchestrates user interactions
- Calls the scheduling dialogs
- Updates tasks via TreeDataProvider

## 🐛 Troubleshooting

### Schedule Not Showing?

1. Make sure you saved after setting the schedule
2. Try refreshing the task list (button in toolbar)
3. Check that the Google Tasks API has permission to update tasks

### Date Format Error?

- Use `YYYY-MM-DD` (e.g., 2025-10-25) or `MM/DD/YYYY` (e.g., 10/25/2025)
- For time: use 12-hour with AM/PM (2:30 PM) or 24-hour format (14:30)

### Changes Not Syncing?

- This is a Google Tasks API limitation
- The extension updates locally but Google syncs across all devices
- May take a few moments to appear on other devices

## 📝 Development Notes

### Building the Extension

```bash
npm install              # Install dependencies
npm run watch           # Watch mode (auto-compile)
npm run compile         # Single compilation
npm test               # Run tests
npm run vscode:prepublish  # Prepare for publishing
```

### Debugging

1. Press `F5` in VSCode to launch the extension in debug mode
2. Open DevTools with `Ctrl+Shift+I` in the extension window
3. Use `console.log()` statements in your code
4. Set breakpoints in VSCode

### Testing the Scheduling

1. Create a test task
2. Right-click → "Set Task Schedule"
3. Select a date and time
4. Verify it shows in the description area
5. Try editing and clearing the schedule

## 📚 Resources

- [Google Tasks API Documentation](https://developers.google.com/tasks)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [RFC 3339 Date Format](https://tools.ietf.org/html/rfc3339)

## 🎉 Summary

Your Google Tasks extension now has full-featured scheduling capability! Users can:

- ✅ See when tasks are due
- ✅ Set/edit/clear due dates and times
- ✅ Create recurring tasks
- ✅ Use intuitive quick-pick dialogs
- ✅ Input dates/times in multiple formats

All changes are synced to Google Tasks automatically!
