import * as vscode from 'vscode'

import loadGoogleTasks from './app/TreeDataLoader'
import { registerRootPath } from './RootPath'
import { extensionQualifiedId } from './Constants'
import telemetry from './telemetry'
import { registerCommands } from './app/commands/commands'
import { ScheduleWebViewProvider } from './app/providers/ScheduleWebViewProvider'

let scheduleWebViewProvider: ScheduleWebViewProvider

export function activate(context: vscode.ExtensionContext) {
  const startTime = process.hrtime()
  telemetry.sendTelemetryEvent('activate')

  registerRootPath(context)

  // Initialize WebView provider
  scheduleWebViewProvider = new ScheduleWebViewProvider(context)

  registerCommands(scheduleWebViewProvider)

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
