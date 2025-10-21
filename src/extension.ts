import * as vscode from 'vscode'

import loadGoogleTasks from './app/TreeDataLoader'
import { registerRootPath } from './RootPath'
import { extensionQualifiedId } from './Constants'
import telemetry from './telemetry'
import { registerCommands } from './app/commands/commands'
import { ScheduleWebViewProvider } from './app/providers/ScheduleWebViewProvider'
import { CalendarWebViewProvider } from './app/providers/CalendarWebViewProvider'
import getOAuthClient from './app/OAuthClient'
import { getStoredToken } from './app/Token'
import gTaskTreeProvider from './app/TreeDataProviders/GTask/GTask.TreeDataProvider'

let scheduleWebViewProvider: ScheduleWebViewProvider
let calendarWebViewProvider: CalendarWebViewProvider

/**
 * Initialize or reinitialize calendar OAuth credentials
 */
export function initializeCalendarOAuth() {
  try {
    const oAuthClient = getOAuthClient()
    const token = getStoredToken()
    oAuthClient.setCredentials(token)
    calendarWebViewProvider.setOAuthClient(oAuthClient)
    calendarWebViewProvider.setTaskProvider(gTaskTreeProvider)
    console.log('[Calendar] OAuth initialized successfully')
  } catch (err) {
    console.log('[Calendar] OAuth not ready:', err)
  }
}

export function activate(context: vscode.ExtensionContext) {
  const startTime = process.hrtime()
  telemetry.sendTelemetryEvent('activate')

  registerRootPath(context)

  // Initialize WebView providers
  scheduleWebViewProvider = new ScheduleWebViewProvider(context)
  calendarWebViewProvider = new CalendarWebViewProvider(context)

  // Initialize Calendar provider with OAuth
  initializeCalendarOAuth()

  registerCommands(scheduleWebViewProvider)

  // Register calendar command
  const calendarCommand = vscode.commands.registerCommand('googleTasks.openCalendar', () => {
    calendarWebViewProvider.showCalendar()
  })
  context.subscriptions.push(calendarCommand)

  loadGoogleTasks()

  logExtensionActivated(startTime)
}

function logExtensionActivated(startTime: [number, number]) {
  const googleTasks = vscode.extensions.getExtension(extensionQualifiedId)!
  const googleTasksVersion = googleTasks.packageJSON.version
  const [secs, nanoseconds] = process.hrtime(startTime)
  const duration = secs * 1000 + Math.floor(nanoseconds / 1000000)
  console.log(`GoogleTasks (v${googleTasksVersion}) activated in ${duration}ms`)
}

export function deactivate() {
  telemetry.dispose()
}
