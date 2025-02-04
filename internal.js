import { Tracker } from 'meteor/tracker'

export const Internal = {}

Internal.globalDefaultTemplate = 'bootstrap3'

Internal.defaultTypeTemplates = {}

Internal.deps = {
  defaultTemplate: new Tracker.Dependency(),
  defaultTypeTemplates: {}
}
