import * as React from 'react'

import type { GameNotificationProps, NotificationItem } from './game-notification'

export interface SystemNotification extends Omit<GameNotificationProps, 'type' | 'onClose'> {
  type?: 'system'
}

export const useGameNotifications = () => {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])

  const addNotification = (notification: Omit<GameNotificationProps, 'onClose'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const newNotification: NotificationItem = {
      ...notification,
      id,
      timestamp: Date.now(),
    }

    setNotifications(prev => [...prev, newNotification])

    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const notifyAchievement = (title: string, description?: string) => {
    return addNotification({
      type: 'achievement',
      title,
      description,
    })
  }

  const notifyQuestUpdate = (quest: string, progress: number) => {
    return addNotification({
      type: 'quest',
      title: quest,
      description: `进度更新至 ${progress}%`,
    })
  }

  const notifyRelationshipChange = (name: string, level: number) => {
    return addNotification({
      type: 'relationship',
      title: `${name} 的好感度发生变化`,
      description: `当前好感度 ${level}`,
    })
  }

  const notifySystem = (config: SystemNotification) => {
    return addNotification({
      type: 'system',
      ...config,
    })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifyAchievement,
    notifyQuestUpdate,
    notifyRelationshipChange,
    notifySystem,
  }
}
