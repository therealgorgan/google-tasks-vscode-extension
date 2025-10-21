import { commands, window } from 'vscode'

import telemetry from '../../telemetry'
import { removeToken } from '../Token'
import { AuthorizeGoogleTreeDataProvider } from '../TreeDataProviders/AuthorizeGoogle.TreeDataProvider'
import initiateUserAuthorization from '../userAuthorization'
import gTaskTreeProvider from '../TreeDataProviders/GTask/GTask.TreeDataProvider'
import { GTaskList } from '../TreeDataProviders/GTask/GTaskList.treeItem'
import { GTask } from '../TreeDataProviders/GTask/GTask.treeItem'
import { showScheduleDialog, confirmClearSchedule } from '../utils/ScheduleDialog'
import { ScheduleWebViewProvider } from '../providers/ScheduleWebViewProvider'

let scheduleWebViewProvider: ScheduleWebViewProvider | undefined

const commandsList = {
  'googleTasks.logout': () => {
    removeToken()
    commands.executeCommand('setContext', 'GoogleUserTokenExists', false)
    window.registerTreeDataProvider('googleTasks', new AuthorizeGoogleTreeDataProvider())
  },
  'googleTasks.initUserGAuth': initiateUserAuthorization,
  'googleTasks.showCompleted': () => {
    commands.executeCommand('setContext', 'ShowCompleted', true)
    commands.executeCommand('setContext', 'HideCompleted', false)
    gTaskTreeProvider.refresh({ showCompleted: true })
  },
  'googleTasks.hideCompleted': () => {
    commands.executeCommand('setContext', 'ShowCompleted', false)
    commands.executeCommand('setContext', 'HideCompleted', true)
    gTaskTreeProvider.refresh({ showCompleted: false })
  },
  'googleTasks.refresh': () => {
    gTaskTreeProvider.refresh()
  },
  'googleTasks.addTaskList': async () => {
    const title = await window.showInputBox({
      prompt: 'Provide a title for the tasklist',
      placeHolder: 'Tasklist title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    gTaskTreeProvider.addTaskList({ requestBody: { title } })
  },
  'googleTasks.deleteTaskList': async (node: GTaskList) => {
    gTaskTreeProvider.deleteTaskList({ tasklist: node.taskList.id || undefined })
  },
  'googleTasks.renameTaskList': async (node: GTaskList) => {
    if (!node.taskList.id) return

    const title = await window.showInputBox({
      prompt: 'Provide a new title for the task list',
      placeHolder: 'Task list title',
      value: node?.taskList?.title || undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return

    gTaskTreeProvider.updateTaskList({
      tasklist: node.taskList.id,
      requestBody: { title },
    })
  },
  'googleTasks.addTask': async (node: GTaskList) => {
    if (node.taskList.id === null) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the task',
      placeHolder: 'Task title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    const notes = await window.showInputBox({
      prompt: 'Provide the notes for the task (optional)',
      placeHolder: 'Notes for the task',
      value: undefined,
      ignoreFocusOut: true,
    })

    gTaskTreeProvider.addTask({ tasklist: node.taskList.id, requestBody: { title, notes } })
  },
  'googleTasks.addSubTask': async (node: GTask) => {
    if (node.task.id === null) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the subtask',
      placeHolder: 'SubTask title',
      value: undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return undefined

    gTaskTreeProvider.addTask({
      tasklist: node.taskListId,
      parent: node.task.id,
      requestBody: { title },
    })
  },
  'googleTasks.deleteTask': async (node: GTask) => {
    if (node.task.id) gTaskTreeProvider.deleteTask({ tasklist: node.taskListId, task: node.task.id })
  },
  'googleTasks.completeTask': async (node: GTask) => {
    if (node.task.id)
      gTaskTreeProvider.patchTask({
        tasklist: node.taskListId,
        task: node.task.id,
        requestBody: {
          status: 'completed',
          hidden: true,
        },
      })
  },
  'googleTasks.renameTask': async (node: GTask) => {
    if (!node.task.id) return

    const title = await window.showInputBox({
      prompt: 'Provide a title for the task',
      placeHolder: 'Task title',
      value: node?.task?.title || undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return

    gTaskTreeProvider.patchTask({
      tasklist: node.taskListId,
      task: node.task.id,
      requestBody: { title },
    })
  },
  'googleTasks.editTask': async (node: GTask) => {
    // This is the same as renameTask - triggered on double-click
    if (!node.task.id) return

    const title = await window.showInputBox({
      prompt: 'Edit task title',
      placeHolder: 'Task title',
      value: node?.task?.title || undefined,
      ignoreFocusOut: true,
    })
    if (title === undefined || title.length === 0) return

    gTaskTreeProvider.patchTask({
      tasklist: node.taskListId,
      task: node.task.id,
      requestBody: { title },
    })
  },
  'googleTasks.setTaskSchedule': async (node: GTask) => {
    if (!node.task.id) {
      window.showErrorMessage('Cannot set schedule for this task')
      return
    }

    if (!scheduleWebViewProvider) {
      window.showErrorMessage('Schedule editor not initialized')
      return
    }

    await scheduleWebViewProvider.showScheduler(
      node.taskListId,
      node.task,
      (schedule) => {
        gTaskTreeProvider.patchTask({
          tasklist: node.taskListId,
          task: node.task.id || '',
          requestBody: {
            due: schedule.dueDateTime,
            ...(schedule.recurring && { description: `Recurring: ${schedule.recurring}` }),
          },
        })
      },
      () => {
        // Cancelled
      }
    )
  },
  'googleTasks.editTaskSchedule': async (node: GTask) => {
    if (!node.task.id) {
      window.showErrorMessage('Cannot edit schedule for this task')
      return
    }

    if (!node.task.due) {
      window.showWarningMessage('This task does not have a schedule. Use "Set Task Schedule" instead.')
      return
    }

    if (!scheduleWebViewProvider) {
      window.showErrorMessage('Schedule editor not initialized')
      return
    }

    await scheduleWebViewProvider.showScheduler(
      node.taskListId,
      node.task,
      (schedule) => {
        gTaskTreeProvider.patchTask({
          tasklist: node.taskListId,
          task: node.task.id || '',
          requestBody: {
            due: schedule.dueDateTime,
            ...(schedule.recurring && { description: `Recurring: ${schedule.recurring}` }),
          },
        })
      },
      () => {
        // Cancelled
      }
    )
  },
  'googleTasks.clearTaskSchedule': async (node: GTask) => {
    if (!node.task.id) {
      window.showErrorMessage('Cannot clear schedule for this task')
      return
    }

    if (!node.task.due) {
      window.showWarningMessage('This task does not have a schedule.')
      return
    }

    const confirmed = await confirmClearSchedule()
    if (!confirmed) {
      return
    }

    window.showInformationMessage(
      `Schedule cleared for ${node.task.title || 'task'}`
    )

    gTaskTreeProvider.patchTask({
      tasklist: node.taskListId,
      task: node.task.id,
      requestBody: {
        due: null, // Clear the due date
      },
    })
  },
}

export function registerCommands(provider?: ScheduleWebViewProvider): void {
  if (provider) {
    scheduleWebViewProvider = provider
  }
  Object.entries(commandsList).forEach(([command, handler]) =>
    commands.registerCommand(command, sendTelemetry(command, handler))
  )
}

function sendTelemetry(command: string, handler: Function) {
  return function () {
    telemetry.sendTelemetryEvent(command.replace('googleTasks.', ''))
    return handler(...arguments)
  }
}
