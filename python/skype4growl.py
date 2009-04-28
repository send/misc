#!/usr/bin/env python2.5
# -*- coding: utf-8 -*-

# 簡単な説明書く?
import sys
import Skype4Py
import Growl

appIcon = Growl.Image.imageFromPath('/Applications/Skype.app/Contents/Resources/SkypeBlue.icns')

notifier = Growl.GrowlNotifier(
  applicationName = 'Skype4Py',
  notifications = ['Message'],
  defaultNotifications = ['Message'],
  applicationIcon = appIcon)
notifier.register()

def OnAttach (status):
  if status == Skype4Py.apiAttachAvailable:
    skype.Attach()
  if status == Skype4Py.apiAttachSuccess:
    notifier.notify(
      noteType = 'Message',
      title = 'Skype4Py GrowlNotifier',
      description = 'Attach succeeded !!',
      sticky = False)


def OnMessageStatus (message, status):
  if status == 'RECEIVED':
    notifier.notify(
      noteType = 'Message',
      title = message.FromDisplayName + '@' + message.Chat.Topic,
      description = message.Body,
      sticky = False)

skype = Skype4Py.Skype()
skype.OnAttachmentStatus = OnAttach
skype.OnMessageStatus = OnMessageStatus

skype.Attach()
Cmd = ''
while not Cmd == 'exit':
  Cmd = raw_input('')

    
